import os
import sys
from datetime import datetime
import whois
from tavily import TavilyClient
from dotenv import load_dotenv

load_dotenv()

def log_debug(message: str):
    """Logs diagnostic details to stderr when LOG_LEVEL is set to debug."""
    if os.getenv("LOG_LEVEL", "").lower() == "debug":
        sys.stderr.write(f"[DEBUG] {message}\n")

def web_search(query: str) -> str:
    """Executes Tavily search for company research."""
    log_debug(f"Tool call: web_search('{query}')")
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        return "Tavily API key not found."
    try:
        client = TavilyClient(api_key=api_key)
        response = client.search(query, search_depth="basic", max_results=3)
        results = [f"- {r['title']}: {r['content']}" for r in response.get("results", [])]
        return "\n".join(results)
    except Exception as e:
        log_debug(f"Search tool failed: {e}")
        return f"Search failed: {e}"

def whois_lookup(domain: str) -> dict:
    """Queries WHOIS records for registration context."""
    log_debug(f"Tool call: whois_lookup('{domain}')")
    try:
        res = whois.whois(domain)
        reg_date = res.creation_date
        if isinstance(reg_date, list):
            reg_date = reg_date[0]
        return {
            "domain": domain,
            "registrar": res.registrar,
            "creation_date": str(reg_date) if reg_date else "Unknown",
            "expiration_date": str(res.expiration_date[0] if isinstance(res.expiration_date, list) else res.expiration_date),
            "org": res.org
        }
    except Exception as e:
        log_debug(f"WHOIS lookup failed for {domain}: {e}")
        return {"error": str(e), "domain": domain}