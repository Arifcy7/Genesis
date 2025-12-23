#!/usr/bin/env python3
"""
Test script for snippet extraction feature
"""
import asyncio
import os
from dotenv import load_dotenv
from main import run_check_agent

load_dotenv()

async def test_snippet_extraction():
    print("=" * 60)
    print("TESTING SNIPPET EXTRACTION")
    print("=" * 60)
    
    # Test claim
    test_claim = "The Eiffel Tower is in Paris, France"
    
    print(f"\n🔍 Testing claim: '{test_claim}'")
    print("\n⏳ Running verification with snippet extraction...")
    
    result = await run_check_agent(test_claim, extract_snippets=True)
    
    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)
    
    print(f"\n✅ VERDICT: {result['verdict']}")
    print(f"📊 CONFIDENCE: {result['confidence']}")
    print(f"📝 EXPLANATION: {result['explanation'][:200]}...")
    
    print(f"\n📚 SOURCES ({len(result['sources'])} found):")
    print("-" * 60)
    
    for i, source in enumerate(result['sources'], 1):
        print(f"\n{i}. {source.get('title', 'N/A')}")
        print(f"   URI: {source.get('uri', 'N/A')}")
        
        # Check if snippet was extracted
        snippet = source.get('snippet')
        if snippet:
            print(f"   📄 SNIPPET: {snippet}")
        else:
            print(f"   📄 SNIPPET: Not available")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_snippet_extraction())
