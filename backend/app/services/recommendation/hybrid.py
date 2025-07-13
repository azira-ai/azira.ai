from sqlalchemy.future import select
from uuid import UUID
import httpx
import json
import logging
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from app.models.item import Item
from app.models.outfit import Outfit
from app.models.user_preference import UserPreference  # Novo modelo para preferências
from app.models.outfit_feedback import OutfitFeedback  # Novo modelo para feedback
from app.schemas.outfit import OutfitCreate
from app.config import settings
from app.models.item import Item 
from sqlalchemy.ext.asyncio import AsyncSession
from .helper import GeminiService  # você pode mover Gemini para um helper geral



class HybridRecommendationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.llm = GeminiService(settings.GEMINI_API_KEY)
        self.trend_colors_2025 = ["sage green", "warm terracotta", "indigo blue", "soft beige", "deep burgundy"]
        self.trend_styles_2025 = ["oversized controlled", "vintage modern", "colorful minimalism", "texture mixing"]

    async def generate_outfit(self, user_id: UUID, event_raw: str, event_json: dict, gender: str) -> Dict:
        """Gera outfit completo com análise contextual"""
        try:
            # 1. Buscar itens do usuário
            result = await self.db.execute(select(Item).filter_by(user_id=user_id))
            items = result.scalars().all()
            
            if not items:
                return {"error": "Nenhum item encontrado no guarda-roupa"}

            # 2. Analisar contexto do evento
            event_context = await self._analyze_event_context(event_raw, event_json)
            
            # 3. Buscar preferências do usuário
            user_preferences = await self._get_user_preferences(user_id)
            
            # 4. Preparar descrições dos itens
            item_descriptions = self._prepare_item_descriptions(items)
            
            # 5. Pontuar itens baseado no evento
            scored_items = await self._score_items_for_event(item_descriptions, event_context, gender)
            
            # 6. Gerar outfit com múltiplas tentativas
            outfit_result = await self._generate_outfit_with_retries(
                event_raw, event_context, scored_items, user_preferences, gender
            )
            
            if not outfit_result.get("outfit"):
                if outfit_result.get("error"):
                    return outfit_result
                return {"error": "Não foi possível gerar um outfit adequado"}
            
            # 7. Validar combinação
            validation_result = await self._validate_outfit_combination(
                outfit_result["outfit"], event_context
            )
            
            # 8. Buscar itens completos do banco
            outfit_items_full = await self._get_outfit_items_full(outfit_result["outfit"])
            
            # 9. Gerar análise final
            final_analysis = await self._analyze_final_outfit(
                event_raw, event_json, outfit_items_full, validation_result, gender
            )
            
            # 10. Salvar no banco
            db_outfit = await self._save_outfit(user_id, event_raw, event_json, outfit_result["outfit"])
            
            return {
                "outfit": db_outfit,
                "items": outfit_items_full,
                "recommendation": final_analysis,
                "confidence": validation_result.get("confidence", 0.8),
                "event_context": event_context,
                "validation": validation_result
            }
            
        except Exception as e:
            logging.error(f"Erro na geração do outfit: {e}")
            return {"error": "Erro interno na geração do outfit"}

    async def _analyze_event_context(self, event_raw: str, event_json: dict) -> Dict:
        """Analisa o contexto do evento para melhor recomendação"""
        prompt = f"""
        Analise este evento e extraia informações relevantes para escolha de roupa:
        
        Evento: {event_raw}
        Detalhes: {json.dumps(event_json)}
        
        Considere:
        - Tipo de evento (trabalho, social, esportivo, etc.)
        - Formalidade necessária
        - Ambiente (indoor/outdoor)
        - Horário provável
        - Clima/estação sugerida
        - Público presente
        
        Retorne APENAS um JSON válido no formato:
        {{
            "formalidade": "casual|semi-formal|formal",
            "ambiente": "indoor|outdoor|misto",
            "horario": "manhã|tarde|noite",
            "clima_sugerido": "quente|frio|ameno",
            "estilo_recomendado": ["lista", "de", "estilos"],
            "cores_sugeridas": ["lista", "de", "cores"],
            "tipo_evento": "categoria do evento",
            "duracao_estimada": "curta|media|longa"
        }}
        """
        
        try:
            response = await self.llm.send_prompt(prompt)
            match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response)
            if match:
                context = json.loads(match.group(0))
                return context
        except Exception as e:
            logging.error(f"Erro ao analisar contexto do evento: {e}")
        
        # Fallback context
        return {
            "formalidade": "casual",
            "ambiente": "indoor",
            "horario": "tarde",
            "clima_sugerido": "ameno",
            "estilo_recomendado": ["casual"],
            "cores_sugeridas": ["neutro"],
            "tipo_evento": "geral",
            "duracao_estimada": "media"
        }

    async def _get_user_preferences(self, user_id: UUID) -> Dict:
        """Busca preferências do usuário baseadas em histórico"""
        try:
            # Buscar outfits anteriores
            stmt = select(Outfit).filter_by(user_id=user_id).order_by(Outfit.created_at.desc()).limit(20)
            result = await self.db.execute(stmt)
            recent_outfits = result.scalars().all()
            
            # Buscar feedback positivo
            stmt = select(OutfitFeedback).filter_by(user_id=user_id).filter(OutfitFeedback.rating >= 4)
            result = await self.db.execute(stmt)
            positive_feedback = result.scalars().all()
            
            # Analisar padrões
            preferences = await self._analyze_user_patterns(recent_outfits, positive_feedback)
            
            return preferences
            
        except Exception as e:
            logging.error(f"Erro ao buscar preferências: {e}")
            return {}

    async def _analyze_user_patterns(self, recent_outfits: List, positive_feedback: List) -> Dict:
        """Analisa padrões de preferência do usuário"""
        if not recent_outfits:
            return {}
        
        # Coletar dados dos outfits
        outfit_data = []
        for outfit in recent_outfits:
            outfit_items = await self._get_outfit_items_full(outfit.items)
            outfit_data.extend([{
                "type": item.type,
                "color": item.color,
                "style": item.style,
                "category": item.category
            } for item in outfit_items])
        
        prompt = f"""
        Analise os padrões de preferência do usuário baseado em seus outfits anteriores:
        
        Dados dos outfits: {json.dumps(outfit_data)}
        
        Identifique:
        - Cores mais usadas
        - Estilos preferidos
        - Combinações favoritas
        - Padrões de formalidade
        
        Retorne JSON:
        {{
            "cores_favoritas": ["lista"],
            "estilos_preferidos": ["lista"],
            "formalidade_usual": "casual|semi-formal|formal",
            "combinacoes_favoritas": ["descrições"],
            "confidence": 0.8
        }}
        """
        
        try:
            response = await self.llm.send_prompt(prompt)
            match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response)
            if match:
                return json.loads(match.group(0))
        except Exception as e:
            logging.error(f"Erro ao analisar padrões: {e}")
        
        return {}

    def _prepare_item_descriptions(self, items: List[Item]) -> List[Dict]:
        """Prepara descrições estruturadas dos itens"""
        return [
            {
                "id": str(item.id),
                "name": item.name,
                "type": item.type,
                "color": item.color,
                "state": item.state,
                "season": item.season,
                "category": item.category,
                "style": item.style,
                "characteristics": item.characteristics,
                "img_url": item.img_url,
                "for_sale": item.for_sale,
                "price": item.price,
            }
            for item in items
        ]

    async def _score_items_for_event(self, items: List[Dict], event_context: Dict, gender: str) -> List[Dict]:
        """Pontua cada peça baseado na adequação ao evento"""
        prompt = f"""
        Contexto do evento: {json.dumps(event_context)}
        Gênero do usuário: {gender}
        Tendências 2025: {json.dumps({"cores": self.trend_colors_2025, "estilos": self.trend_styles_2025})}
        
        Para cada peça, dê uma pontuação de 0-10 considerando:
        - Adequação ao evento (40%)
        - Estação/clima (25%)
        - Estado da peça (15%)
        - Tendências 2025 (20%)
        
        Peças: {json.dumps(items)}
        
        Retorne APENAS um JSON válido:
        {{
            "scores": [
                {{
                    "id": "id_da_peca",
                    "score": 8.5,
                    "reason": "motivo da pontuação",
                    "category": "TOP|BOTTOM|SHOES"
                }}
            ]
        }}
        """
        
        try:
            response = await self.llm.send_prompt(prompt)
            match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response)
            if match:
                result = json.loads(match.group(0))
                return result.get("scores", [])
        except Exception as e:
            logging.error(f"Erro ao pontuar itens: {e}")
        
        # Fallback: pontuação neutra
        return [{"id": item["id"], "score": 7.0, "reason": "Pontuação padrão", "category": item["category"]} for item in items]

    async def _generate_outfit_with_retries(self, event_raw: str, event_context: Dict, scored_items: List[Dict], user_preferences: Dict, gender: str) -> Dict:
        """Gera outfit com múltiplas tentativas e estratégias"""
        
        # Verificar se há itens de cada categoria necessária
        categories_available = {}
        for item in scored_items:
            category = item.get("category", "")
            if category not in categories_available:
                categories_available[category] = []
            categories_available[category].append(item)
        
        required_categories = {"TOP", "BOTTOM", "SHOES"}
        missing_categories = required_categories - set(categories_available.keys())
        
        if missing_categories:
            return {"error": f"Categorias faltando no guarda-roupa: {missing_categories}"}
        
        # Ordenar por pontuação
        for category in categories_available:
            categories_available[category].sort(key=lambda x: x.get("score", 0), reverse=True)
        
        # Múltiplas tentativas com diferentes estratégias
        strategies = [
            "best_scored",  # Melhores pontuações
            "trend_focused",  # Foco em tendências
            "user_preference",  # Baseado em preferências
            "color_harmony"  # Harmonia de cores
        ]
        
        for strategy in strategies:
            try:
                outfit = await self._try_outfit_generation(event_raw, event_context, categories_available, user_preferences, strategy, gender)
                if outfit and len(outfit) == 3:
                    return {"outfit": outfit, "strategy": strategy}
            except Exception as e:
                logging.error(f"Estratégia {strategy} falhou: {e}")
        
        # Fallback final
        return self._generate_fallback_outfit(categories_available)

    async def _try_outfit_generation(self, event_raw: str, event_context: Dict, categories_available: Dict, user_preferences: Dict, strategy: str, gender: str) -> List[str]:
        """Tenta gerar outfit com estratégia específica"""
        
        strategy_prompts = {
            "best_scored": "Priorize as peças com melhores pontuações gerais",
            "trend_focused": f"Foque nas tendências 2025: {self.trend_colors_2025} e {self.trend_styles_2025}",
            "user_preference": f"Considere as preferências do usuário: {json.dumps(user_preferences)}",
            "color_harmony": "Priorize harmonia de cores e combinações elegantes"
        }
        
        prompt = f"""
        EVENTO: {event_raw}
        GÊNERO DO USUÁRIO: {gender}
        CONTEXTO: {json.dumps(event_context)}
        ESTRATÉGIA: {strategy_prompts.get(strategy, "")}
        
        PEÇAS DISPONÍVEIS POR CATEGORIA:
        TOP: {json.dumps(categories_available.get("TOP", [])[:5])}
        BOTTOM: {json.dumps(categories_available.get("BOTTOM", [])[:5])}
        SHOES: {json.dumps(categories_available.get("SHOES", [])[:5])}
        
        INSTRUÇÕES:
        1. Escolha EXATAMENTE 1 peça de cada categoria (TOP, BOTTOM, SHOES)
        2. Considere pontuações, contexto do evento e estratégia
        3. Garanta harmonia de cores e estilos
        4. Adequação às tendências 2025
        
        RESPOSTA OBRIGATÓRIA:
        Retorne APENAS um JSON válido no formato:
        {{"outfit": ["id_top", "id_bottom", "id_shoes"], "confidence": 0.95}}
        """
        
        response = await self.llm.send_prompt(prompt)
        
        try:
            match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response)
            if match:
                result = json.loads(match.group(0))
                outfit = result.get("outfit", [])
                if len(outfit) == 3:
                    return outfit
        except Exception as e:
            logging.error(f"Erro ao parsear resposta da estratégia {strategy}: {e}")
        
        return []

    def _generate_fallback_outfit(self, categories_available: Dict) -> Dict:
        """Gera outfit de fallback quando IA falha"""
        try:
            outfit = []
            missing = []

            for category in ["TOP", "BOTTOM", "SHOES"]:
                if category in categories_available and categories_available[category]:
                    outfit.append(categories_available[category][0]["id"])
                else:
                    missing.append(category)

            # Se todos os itens estão presentes no guarda-roupa
            if len(outfit) == 3:
                return {"outfit": outfit, "strategy": "fallback"}

            # Se faltou item, tentar buscar no banco por peças à venda
            logging.info(f"Buscando peças à venda para categorias faltantes: {missing}")
            extra_items = self._find_items_for_sale(missing)

            if extra_items:
                outfit += extra_items
                if len(outfit) == 3:
                    return {"outfit": outfit, "strategy": "fallback+store"}

            # Ainda faltando peças, gerar descrição do problema
            explanation = self._explain_missing_items(missing)
            return {"error": "Não foi possível gerar outfit", "missing": missing, "explanation": explanation}

        except Exception as e:
            logging.error(f"Erro no fallback: {e}")
            return {"error": "Erro ao tentar gerar outfit de fallback"}

    async def _validate_outfit_combination(self, outfit_ids: List[str], event_context: Dict) -> Dict:
        """Valida se as peças combinam bem entre si"""
        try:
            outfit_items = await self._get_outfit_items_full(outfit_ids)
            
            prompt = f"""
            CONTEXTO DO EVENTO: {json.dumps(event_context)}
            
            PEÇAS SELECIONADAS:
            {json.dumps([{
                "id": item.id,
                "type": item.type,
                "color": item.color,
                "style": item.style,
                "category": item.category
            } for item in outfit_items])}
            
            CRITÉRIOS DE VALIDAÇÃO:
            1. Harmonia de cores (30%)
            2. Compatibilidade de estilos (25%)
            3. Adequação ao evento (25%)
            4. Tendências 2025 (20%)
            
            Retorne APENAS um JSON válido:
            {{
                "valid": true,
                "confidence": 0.85,
                "score": 8.5,
                "strengths": ["pontos fortes"],
                "improvements": ["sugestões de melhoria"],
                "color_harmony": 8.0,
                "style_compatibility": 9.0
            }}
            """
            
            response = await self.llm.send_prompt(prompt)
            match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response)
            if match:
                return json.loads(match.group(0))
                
        except Exception as e:
            logging.error(f"Erro na validação: {e}")
        
        return {"valid": True, "confidence": 0.7, "score": 7.0}

    async def _get_outfit_items_full(self, outfit_ids: List[str]) -> List[Item]:
        """Busca itens completos do banco de dados"""
        try:
            uuid_ids = [UUID(id_) for id_ in outfit_ids]
            stmt = select(Item).filter(Item.id.in_(uuid_ids))
            result = await self.db.execute(stmt)
            return result.scalars().all()
        except Exception as e:
            logging.error(f"Erro ao buscar itens: {e}")
            return []

    async def _analyze_final_outfit(self, event_raw: str, event_json: dict, outfit_items: List[Item], validation_result: Dict, gender: str) -> str:
        """Gera análise final do outfit"""
        prompt = f"""
        EVENTO: {event_raw}
        DETALHES: {json.dumps(event_json)}
        Gênero do usuário: {gender}

        
        OUTFIT SELECIONADO:
        {json.dumps([{
            "nome": item.name,
            "tipo": item.type,
            "cor": item.color,
            "estilo": item.style,
            "categoria": item.category
        } for item in outfit_items])}
        
        ANÁLISE DE VALIDAÇÃO:
        {json.dumps(validation_result)}
        
        TENDÊNCIAS 2025:
        - Cores: {', '.join(self.trend_colors_2025)}
        - Estilos: {', '.join(self.trend_styles_2025)}
        
        Crie uma análise profissional e envolvente que:
        1. Explique por que essas peças funcionam juntas
        2. Destaque como se adequam ao evento
        3. Mencione tendências seguidas
        4. Dê dicas de styling
        5. Seja inspiradora e confiante
        
        Resposta em português, tom profissional mas acessível.
        """
        
        try:
            response = await self.llm.send_prompt(prompt)
            return response or "Look criado com sucesso! Suas peças combinam perfeitamente para o evento."
        except Exception as e:
            logging.error(f"Erro na análise final: {e}")
            return "Look criado com sucesso! Suas peças combinam perfeitamente para o evento."

    async def _save_outfit(self, user_id: UUID, event_raw: str, event_json: dict, outfit_ids: List[str]) -> Outfit:
        """Salva outfit no banco de dados"""
        try:
            outfit_data = OutfitCreate(
                event_raw=event_raw,
                event_json=event_json,
                items=[UUID(id_) for id_ in outfit_ids]
            )
            
            db_outfit = Outfit(**outfit_data.dict(), user_id=user_id)
            self.db.add(db_outfit)
            await self.db.commit()
            await self.db.refresh(db_outfit)
            
            return db_outfit
            
        except Exception as e:
            logging.error(f"Erro ao salvar outfit: {e}")
            raise

    async def save_user_feedback(self, user_id: UUID, outfit_id: UUID, rating: int, feedback: str) -> None:
        """Salva feedback do usuário para melhorar futuras recomendações"""
        try:
            feedback_record = OutfitFeedback(
                user_id=user_id,
                outfit_id=outfit_id,
                rating=rating,
                feedback=feedback,
                created_at=datetime.utcnow()
            )
            
            self.db.add(feedback_record)
            await self.db.commit()
            
            # Atualizar preferências do usuário se rating for alto
            if rating >= 4:
                await self._update_user_preferences(user_id, outfit_id)
                
        except Exception as e:
            logging.error(f"Erro ao salvar feedback: {e}")

    async def _update_user_preferences(self, user_id: UUID, outfit_id: UUID) -> None:
        """Atualiza preferências do usuário baseado em feedback positivo"""
        try:
            # Buscar o outfit
            stmt = select(Outfit).filter_by(id=outfit_id)
            result = await self.db.execute(stmt)
            outfit = result.scalar_one_or_none()
            
            if outfit:
                # Buscar itens do outfit
                outfit_items = await self._get_outfit_items_full([str(id_) for id_ in outfit.items])
                
                # Extrair padrões positivos
                colors = [item.color for item in outfit_items]
                styles = [item.style for item in outfit_items]
                
                # Atualizar ou criar preferências
                preference_data = {
                    "preferred_colors": colors,
                    "preferred_styles": styles,
                    "last_updated": datetime.utcnow()
                }
                
                # Salvar preferências (implementar modelo UserPreference)
                logging.info(f"Atualizando preferências do usuário {user_id}: {preference_data}")
                
        except Exception as e:
            logging.error(f"Erro ao atualizar preferências: {e}")

    async def get_outfit_analytics(self, user_id: UUID) -> Dict:
        """Retorna analytics dos outfits do usuário"""
        try:
            # Buscar todos os outfits do usuário
            stmt = select(Outfit).filter_by(user_id=user_id)
            result = await self.db.execute(stmt)
            outfits = result.scalars().all()
            
            # Buscar feedbacks
            stmt = select(OutfitFeedback).filter_by(user_id=user_id)
            result = await self.db.execute(stmt)
            feedbacks = result.scalars().all()
            
            # Calcular estatísticas
            total_outfits = len(outfits)
            avg_rating = sum(f.rating for f in feedbacks) / len(feedbacks) if feedbacks else 0
            most_used_items = await self._get_most_used_items(user_id)
            
            return {
                "total_outfits": total_outfits,
                "average_rating": round(avg_rating, 2),
                "most_used_items": most_used_items,
                "feedback_count": len(feedbacks),
                "recent_outfits": outfits[-5:] if outfits else []
            }
            
        except Exception as e:
            logging.error(f"Erro ao gerar analytics: {e}")
            return {}

    async def _get_most_used_items(self, user_id: UUID) -> List[Dict]:
        """Retorna os itens mais usados em outfits"""
        try:
            stmt = select(Outfit).filter_by(user_id=user_id)
            result = await self.db.execute(stmt)
            outfits = result.scalars().all()
            
            # Contar uso dos itens
            item_usage = {}
            for outfit in outfits:
                for item_id in outfit.items:
                    item_usage[item_id] = item_usage.get(item_id, 0) + 1
            
            # Buscar detalhes dos itens mais usados
            if item_usage:
                top_items = sorted(item_usage.items(), key=lambda x: x[1], reverse=True)[:5]
                stmt = select(Item).filter(Item.id.in_([item[0] for item in top_items]))
                result = await self.db.execute(stmt)
                items = result.scalars().all()
                
                return [
                    {
                        "item": item,
                        "usage_count": item_usage.get(item.id, 0)
                    }
                    for item in items
                ]
            
        except Exception as e:
            logging.error(f"Erro ao buscar itens mais usados: {e}")
        
        return []
    

    def _find_items_for_sale(self, missing_categories: List[str]) -> List[str]:
        """Busca itens à venda no banco para categorias faltantes"""
        try:
            found_items = []

            for category in missing_categories:
                stmt = select(Item).where(Item.for_sale == True, Item.category == category).limit(1)
                result = self.db.execute(stmt)
                item = result.scalar_one_or_none()
                if item:
                    found_items.append(str(item.id))

            return found_items
        except Exception as e:
            logging.error(f"Erro ao buscar itens à venda: {e}")
            return []


    def _explain_missing_items(self, missing_categories: List[str]) -> str:
        """Retorna uma explicação para o motivo de não conseguir montar o outfit"""
        return (
            "Não foi possível montar o look completo pois as seguintes categorias estão ausentes: "
            + ", ".join(missing_categories)
            + ". Considere adicionar peças dessas categorias ou adquirir novas disponíveis na loja."
        )
