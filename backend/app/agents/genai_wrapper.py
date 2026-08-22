import os
import traceback

genai_available = False


class _FallbackClient:
    def generate_text(self, prompt: str, model: str = None) -> str:
        # No model available; return prompt as a debug fallback
        return str(prompt)


class GenAIClient:
    def __init__(self):
        self.backend = None
        self.client = None
        self.model = os.environ.get('GENAI_MODEL') or os.environ.get('GENAI_MODEL_ID')
        # Try new google.genai
        try:
            from google import genai as genai_new  # type: ignore
            # Create text client
            try:
                self.client = genai_new.TextGenerationClient()
                self.backend = 'genai'
                global genai_available
                genai_available = True
            except Exception:
                # Some versions expose a different API; fall through
                self.client = None
        except Exception:
            # Try old google.generativeai
            try:
                import google.generativeai as genai_old  # type: ignore
                self.client = genai_old
                self.backend = 'generativeai'
                genai_available = True
            except Exception:
                self.client = None

    def generate_text(self, prompt: str, model: str = None) -> str:
        try:
            if self.backend == 'genai' and self.client is not None:
                mdl = model or self.model or 'models/text-bison-001'
                resp = self.client.generate(model=mdl, prompt=prompt)
                # resp may have .text or .candidates
                text = ''
                if hasattr(resp, 'candidates') and len(resp.candidates) > 0:
                    text = getattr(resp.candidates[0], 'content', '')
                elif hasattr(resp, 'result'):
                    text = getattr(resp.result, 'text', '')
                else:
                    text = str(resp)
                return text
            if self.backend == 'generativeai' and self.client is not None:
                # old package: try responses.create or GenerativeModel
                try:
                    # responses.create may accept input
                    resp = self.client.responses.create(input=prompt)
                    if hasattr(resp, 'output_text'):
                        return resp.output_text
                    return str(resp)
                except Exception:
                    try:
                        model_api = self.client.GenerativeModel('gemini-2.5-flash')
                        resp = model_api.generate_content(prompt)
                        return getattr(resp, 'text', str(resp))
                    except Exception:
                        return str(prompt)
            return str(prompt)
        except Exception:
            traceback.print_exc()
            return str(prompt)


# singleton
genai_client = GenAIClient()
