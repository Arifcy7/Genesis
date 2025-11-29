#!/usr/bin/env python3
"""
Test script to verify Google API key works with Google GenAI
"""
import os
from google import genai
from google.genai import types

def test_api_key():
    # Set the API key
    api_key = "AIzaSyABiXbqXMCISc7_GDDguZhJwvcJsLQWOiA"
    os.environ["GOOGLE_API_KEY"] = api_key

    try:
        # Initialize the client
        print("🔄 Initializing Google GenAI client...")
        client = genai.Client(api_key=api_key)

        # Test a simple text generation
        print("🔄 Testing text generation...")
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents="Hello! Please respond with just 'API key is working!' if you can read this.",
            config=types.GenerateContentConfig(temperature=0.0)
        )

        # Check the response
        if response and response.text:
            print("✅ API key is working!")
            print(f"Response: {response.text.strip()}")
            return True
        else:
            print("❌ No response received")
            return False

    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
            print("⚠️  API key is valid but quota exceeded!")
            print("The API key works, but you've reached your usage limit.")
            print("Check your Google AI Studio billing/usage at: https://ai.google.dev/aistudio")
            return True
        elif "403" in error_str or "PERMISSION_DENIED" in error_str:
            print("❌ API key is invalid or doesn't have proper permissions")
            return False
        else:
            print(f"❌ API key test failed: {error_str}")
            return False

if __name__ == "__main__":
    print("🧪 Testing Google API Key...")
    success = test_api_key()
    if success:
        print("\n🎉 Google API key is valid and working!")
    else:
        print("\n💥 Google API key is invalid or not working.")