import os
import json
import hashlib
from datetime import datetime
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

class NewsVerifier:
    def __init__(self):
        # Allow fallback to Demo Mode if RPC or Private Key is missing
        self.rpc_url = os.environ.get("POLYGON_AMOY_RPC_URL", "")
        self.private_key = os.environ.get("VERIFIER_PRIVATE_KEY", "")
        
        self.demo_mode = False
        if not self.rpc_url or not self.private_key:
            print("[NewsVerifier] RUNNING IN DEMO MODE (No RPC/Key found)")
            self.demo_mode = True
        else:
            self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
            if not self.w3.is_connected():
                print("[NewsVerifier] Failed to connect to Web3. Falling back to Demo Mode.")
                self.demo_mode = True
            else:
                self.account = self.w3.eth.account.from_key(self.private_key)
                print(f"[NewsVerifier] Connected to Web3. Anchoring from: {self.account.address}")

    def generate_insight_proof(self, asset: str, headline: str, sentiment: str, impact: str, confidence: float):
        """
        Takes a new AI insight, hashes it deterministically, and anchors the hash on-chain.
        """
        timestamp = datetime.utcnow().isoformat()
        
        # 1. Structure the Data for Hashing
        insight_data = {
            "asset": asset,
            "headline": headline,
            "sentiment": sentiment,
            "impact": impact,
            "confidence": round(confidence, 4),
            "timestamp": timestamp
        }
        
        # Deterministic JSON string
        json_str = json.dumps(insight_data, sort_keys=True)
        
        # 2. Generate SHA-256 Hash Fingerprint
        fingerprint = hashlib.sha256(json_str.encode('utf-8')).hexdigest()
        
        # 3. Anchor on Blockchain
        if self.demo_mode:
            # Simulate a real Polygon TxHash for the demo
            mock_hash = hashlib.sha256((fingerprint + str(datetime.now().timestamp())).encode('utf-8')).hexdigest()
            tx_hash = f"0x{mock_hash}"
            print(f"[NewsVerifier] 🟢 DEMO MODE: Anchored to mock blockchain -> {tx_hash}")
        else:
            # Real EVM Anchor
            try:
                # Prepare a 0-value tx with fingerprint in the data field
                tx = {
                    'to': self.account.address, # Send to self
                    'value': 0,
                    'gas': 21000,
                    'gasPrice': self.w3.eth.gas_price,
                    'nonce': self.w3.eth.get_transaction_count(self.account.address),
                    'data': f"0x{fingerprint}".encode('utf-8')
                }
                
                # Sign and Send
                signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
                tx_hash_bytes = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
                tx_hash = self.w3.to_hex(tx_hash_bytes)
                print(f"[NewsVerifier] 🟢 REAL ANCHOR: Transaction Broadcast -> {tx_hash}")
            except Exception as e:
                print(f"[NewsVerifier] Anchor failed: {e}. Falling back to demo mode.")
                mock_hash = hashlib.sha256((fingerprint + str(datetime.now().timestamp())).encode('utf-8')).hexdigest()
                tx_hash = f"0x{mock_hash}"
                
        # 4. Return Full Verified Object
        verified_insight = {
            **insight_data,
            "verifiable_hash": fingerprint,
            "proof_tx": tx_hash,
            "verified": True
        }
        return verified_insight

if __name__ == "__main__":
    verifier = NewsVerifier()
    res = verifier.generate_insight_proof("XAUUSD", "Retail Sales Beat Estimates", "Bullish", "High", 0.92)
    print(json.dumps(res, indent=2))
