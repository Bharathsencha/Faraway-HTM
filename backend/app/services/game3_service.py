import json
import os
import random
from app.agents.genai_wrapper import genai_available

TOPICS = {
  "EASY": [
    "Explain what a REST API is",
    "What is Git and why do developers use it",
    "What does Docker do and why is it useful",
    "Explain what a database index does",
    "What is the difference between SQL and NoSQL",
    "What is an API endpoint",
    "Explain what version control is",
    "What is a variable in programming",
    "What is the difference between frontend and backend",
    "Explain what a function is in programming",
    "What is HTML and what is it used for",
    "What is CSS and how does it work",
    "Explain what JavaScript does in a website",
    "What is a loop and why do we use it",
    "What is an array in programming",
    "What is a library vs a framework",
    "Explain what open source software means",
    "What is a bug in software and how do you fix one",
    "What is an IDE and why do developers use it",
    "Explain what a server does",
    "What is the difference between HTTP and HTTPS",
    "What is a URL and how does it work",
    "Explain what a cookie is in a browser",
    "What is JSON and why is it used",
    "What is a programming language",
    "Explain what RAM and storage do differently",
    "What is an operating system",
    "What is the difference between a class and an object",
    "Explain what a package manager does",
    "What is responsive web design",
    "What is an IP address",
    "Explain what a firewall does",
    "What is cloud computing in simple terms",
    "What is the difference between a stack and a queue",
    "Explain what recursion means",
    "What is a null value in programming",
    "What is debugging and how do you approach it",
    "Explain what a pull request is",
    "What is a boolean in programming",
    "What is the difference between == and ===",
    "What is semantic HTML",
    "Explain what an algorithm is",
    "What is a linked list",
    "What is the difference between GET and POST requests",
    "Explain what asynchronous programming means",
    "What is a compiler vs an interpreter",
    "What is a binary search",
    "Explain what a hash map is",
    "What is object oriented programming",
    "What is the purpose of a README file"
  ],

  "MEDIUM": [
    "How does JWT authentication work",
    "Explain microservices vs monolith architecture",
    "What is Redis and when would you use it",
    "How does load balancing work",
    "Explain the difference between TCP and UDP",
    "What is a message queue and why is it used",
    "How does indexing improve database performance",
    "Explain what Docker containers vs virtual machines are",
    "What is CI CD and how does it work",
    "How does OAuth 2.0 work",
    "Explain what WebSockets are and when to use them",
    "What is a CDN and how does it help performance",
    "How does caching work in web applications",
    "Explain what ACID properties mean in databases",
    "What is a reverse proxy and why is it used",
    "How does the event loop work in JavaScript",
    "Explain what SQL joins are and when to use each",
    "What is the difference between horizontal and vertical scaling",
    "How does pagination work in APIs",
    "Explain what a singleton design pattern is",
    "What is the difference between synchronous and asynchronous APIs",
    "How does a browser render a webpage",
    "Explain what Kubernetes does",
    "What is GraphQL and how is it different from REST",
    "How does session management work in web apps",
    "Explain what environment variables are and why they matter",
    "What is the MVC design pattern",
    "How does rate limiting work",
    "Explain what CORS is and why it exists",
    "What is a database transaction",
    "How does DNS resolution work",
    "Explain what middleware is in a web framework",
    "What is the difference between monorepo and polyrepo",
    "How does garbage collection work",
    "Explain what a webhook is",
    "What is the observer design pattern",
    "How does two factor authentication work",
    "Explain what serverless architecture means",
    "What is the difference between REST and SOAP",
    "How does connection pooling work",
    "Explain what an ORM does",
    "What is the factory design pattern",
    "How does SSL TLS encryption work",
    "Explain what blue green deployment means",
    "What is eventual consistency",
    "How does a HashMap work internally",
    "Explain what dependency injection is",
    "What is the difference between SQL transactions and NoSQL",
    "How does pub sub messaging pattern work",
    "Explain what a binary tree is and where it is used"
  ],

  "HARD": [
    "How would you design a URL shortener system",
    "Explain CAP theorem with a real world example",
    "How does consistent hashing work",
    "Design a rate limiter for a high traffic API",
    "Explain how a message queue like Kafka works internally",
    "How would you design a notification system",
    "Explain the two phase commit protocol",
    "How does a distributed cache work",
    "What is the saga pattern in microservices",
    "How would you design a search autocomplete system",
    "Explain what database sharding is and its tradeoffs",
    "How does leader election work in distributed systems",
    "What is the difference between optimistic and pessimistic locking",
    "How would you design a job scheduler system",
    "Explain what a bloom filter is and when to use it",
    "How does write ahead logging work in databases",
    "What is the CQRS pattern and when would you use it",
    "How would you design a key value store",
    "Explain what a merkle tree is used for",
    "How does an API gateway work in microservices",
    "What is backpressure in streaming systems",
    "How would you design a recommendation engine",
    "Explain what a circuit breaker pattern does",
    "How does MapReduce work",
    "What is the difference between strong and eventual consistency",
    "How would you design a distributed logging system",
    "Explain what a time series database is and when to use it",
    "How does vector clocks work in distributed systems",
    "What is the strangler fig pattern in system migration",
    "How would you design a content delivery network",
    "Explain what a write through vs write back cache is",
    "How does a graph database differ from relational database",
    "What is the outbox pattern in microservices",
    "How would you design an event driven architecture",
    "Explain how Elasticsearch works internally",
    "What is a long polling vs server sent events vs websockets",
    "How does database replication work",
    "Explain what idempotency means and why it matters in APIs",
    "How would you design a distributed ID generator",
    "What is the difference between hot and cold storage",
    "How does a service mesh work",
    "Explain what a Trie data structure is used for",
    "How would you implement a distributed transaction",
    "What is the difference between push and pull in messaging",
    "How does a B plus tree work in database storage",
    "Explain what chaos engineering is",
    "How would you design a leaderboard system",
    "What is the difference between synchronous and event driven microservices",
    "How does a columnar database differ from row based storage",
    "Explain what a deadlock is and how to prevent it"
  ],

  "GOD": [
    "How would you scale a chat app to 10 million concurrent users",
    "Design Google Drive from scratch",
    "How would you build a real time collaborative document editor like Google Docs",
    "Design a fault tolerant payment processing system",
    "How would you build YouTube video processing and streaming pipeline",
    "Design Twitter timeline generation at scale",
    "How would you build a global distributed database like DynamoDB",
    "Design an Uber like real time location tracking system",
    "How would you build a fraud detection system at scale",
    "Design a search engine from scratch",
    "How would you build a distributed machine learning training system",
    "Design Instagram at 1 billion users scale",
    "How would you build a global DNS system",
    "Design a stock exchange matching engine",
    "How would you build a real time multiplayer game server",
    "Design a global content delivery network from scratch",
    "How would you build a distributed file system like HDFS",
    "Design a hotel booking system like Airbnb at global scale",
    "How would you build a blockchain based transaction system",
    "Design a healthcare data platform with real time analytics",
    "How would you build a ride sharing surge pricing algorithm",
    "Design a distributed task queue that handles 1 million jobs per minute",
    "How would you build a real time recommendation system for Netflix",
    "Design a system that detects and prevents DDoS attacks at scale",
    "How would you build a multi region active active database system",
    "Design a global authentication system that handles 100 million requests per day",
    "How would you build a zero downtime deployment system for 500 microservices",
    "Design a real time ad bidding system that responds in under 100 milliseconds",
    "How would you build a distributed tracing system like Jaeger",
    "Design a food delivery system with real time tracking at country scale",
    "How would you build an autocomplete system that handles 10 billion searches per day",
    "Design a code execution engine like LeetCode that safely runs untrusted code",
    "How would you build a global IoT data ingestion platform",
    "Design a machine learning feature store at petabyte scale",
    "How would you build a distributed secret management system",
    "Design a video conferencing system like Zoom for 1 million concurrent calls",
    "How would you build a global event streaming platform like Kafka at Meta scale",
    "Design a system that can process 1 million financial transactions per second",
    "How would you build a self healing microservices infrastructure",
    "Design a multi tenant SaaS platform with data isolation at enterprise scale",
    "How would you build a global analytics pipeline processing 100TB daily",
    "Design a privacy preserving data sharing platform across organizations",
    "How would you build a distributed rate limiter that works across 50 data centers",
    "Design an airport baggage tracking system at global scale",
    "How would you build a news feed ranking algorithm for 2 billion users",
    "Design a system to detect deepfake content at upload time at YouTube scale",
    "How would you build a low latency trading system that executes in microseconds",
    "Design a global disaster recovery system with recovery time under 30 seconds",
    "How would you build a semantic search engine using vector embeddings at scale",
    "Design an autonomous vehicle data processing and update system"
  ]
}

CONCEPTS = {}
# Build the CONCEPTS dictionary dynamically with appropriate categorizations
concept_counter = 1
for difficulty, list_of_topics in TOPICS.items():
    for topic in list_of_topics:
        category = "General Software Engineering"
        t_lower = topic.lower()
        if "api" in t_lower or "rest" in t_lower or "graphql" in t_lower or "http" in t_lower or "dns" in t_lower:
            category = "API Design & Networking"
        elif "git" in t_lower or "version control" in t_lower or "pull request" in t_lower or "monorepo" in t_lower or "polyrepo" in t_lower:
            category = "Version Control"
        elif "docker" in t_lower or "container" in t_lower or "kubernetes" in t_lower or "serverless" in t_lower or "cloud" in t_lower or "deployment" in t_lower:
            category = "DevOps & Cloud"
        elif "database" in t_lower or "sql" in t_lower or "nosql" in t_lower or "index" in t_lower or "transaction" in t_lower or "caching" in t_lower or "redis" in t_lower or "dynamodb" in t_lower or "acid" in t_lower or "sharding" in t_lower or "replication" in t_lower:
            category = "Databases & Caching"
        elif "design pattern" in t_lower or "pattern" in t_lower or "singleton" in t_lower or "factory" in t_lower or "observer" in t_lower or "mvc" in t_lower:
            category = "Design Patterns"
        elif "security" in t_lower or "auth" in t_lower or "jwt" in t_lower or "oauth" in t_lower or "encryption" in t_lower or "ssl" in t_lower or "tls" in t_lower or "two factor" in t_lower or "ddos" in t_lower or "secret management" in t_lower:
            category = "Security & Auth"
        elif "html" in t_lower or "css" in t_lower or "javascript" in t_lower or "web" in t_lower or "browser" in t_lower or "cookie" in t_lower or "responsive" in t_lower or "collaborative" in t_lower or "docs" in t_lower:
            category = "Web Development"
        elif "distributed" in t_lower or "cap theorem" in t_lower or "microservice" in t_lower or "scale" in t_lower or "scaling" in t_lower or "kafka" in t_lower or "queue" in t_lower or "load balancing" in t_lower or "uber" in t_lower or "netflix" in t_lower or "instagram" in t_lower or "youtube" in t_lower or "rate limiter" in t_lower:
            category = "System Design & Scale"
        elif "algorithm" in t_lower or "search" in t_lower or "recursion" in t_lower or "tree" in t_lower or "hash" in t_lower or "list" in t_lower or "data structure" in t_lower or "stack" in t_lower or "queue" in t_lower or "binary" in t_lower or "graph" in t_lower:
            category = "Algorithms & Data Structures"
            
        card_id = f"c{concept_counter}"
        CONCEPTS[card_id] = {
            "id": card_id,
            "title": topic,
            "category": category,
            "difficulty": difficulty.lower()
        }
        concept_counter += 1

def fetch_random_concept(exclude_ids, level=None):
    # Filter by level if provided
    available = []
    for card_id, card in CONCEPTS.items():
        if card_id in exclude_ids:
            continue
        if level and card["difficulty"].upper() != level.upper():
            continue
        available.append(card)
        
    if not available:
        return None
    return random.choice(available)

def count_fillers(text):
    if not text:
        return 0
    words = text.lower().split()
    fillers = ['um', 'uh', 'like', 'so', 'actually', 'basically']
    return sum(1 for w in words if w.strip(".,!?") in fillers)

def transcribe_audio_file(audio_path):
    model = genai.GenerativeModel("gemini-2.5-flash")
    audio_file = genai.upload_file(path=audio_path)
    transcription_response = model.generate_content(
        [audio_file, "Output ONLY the direct transcription of the speech. Do not add metadata or comments. Keep original filler words like 'um', 'uh', 'like' intact."]
    )
    transcript = transcription_response.text.strip()
    genai.delete_file(audio_file.name)
    return transcript

def run_multi_agent_evaluation(question_id, text_answer=None, audio_path=None):
    concept = CONCEPTS.get(question_id, CONCEPTS["c1"])
    topic = concept["title"]
    level = concept["difficulty"]
    
    # Configure model
    model = genai.GenerativeModel("gemini-2.5-flash")

    # 1. Transcribe audio if needed
    if audio_path:
        transcript = transcribe_audio_file(audio_path)
    else:
        transcript = text_answer or ""

    # 2. Count fillers
    filler_count = count_fillers(transcript)

    # 3. Call scoring logic
    prompt = f"""
You are an expert technical interview coach.

Topic given: {topic}
Difficulty: {level}
User's speech: {transcript}
Filler words detected: {filler_count}

Return ONLY valid JSON, no extra text, no markdown:
{{
  "total_score": 75,
  "content_score": 28,
  "fluency_score": 24,
  "structure_score": 23,
  "filler_penalty": -5,
  "feedback": "one sentence what they did well",
  "improve": "one sentence what to fix next time",
  "better_line": "rewrite their weakest sentence better",
  "weak_filler": "the filler word they used most"
}}
"""
    response = model.generate_content(prompt)
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
            
    parsed_json = json.loads(text.strip())
    total_score = parsed_json.get("total_score", 70)
    
    # As requested: We don't deduct lives if they do well. We ONLY deduct if they bomb it.
    life_consumed = total_score < 30
    
    # Base XP scaling
    xp_awarded = int((total_score / 100) * 200) if total_score >= 50 else 10

    return {
        "clarity": parsed_json.get("fluency_score", 20),
        "structure": parsed_json.get("structure_score", 20),
        "depth": parsed_json.get("content_score", 20),
        "brevity": 20,
        "totalScore": total_score,
        "feedback": parsed_json.get("feedback", ""),
        "xpAwarded": xp_awarded,
        "lifeConsumed": life_consumed,
        
        # New Gemini scoring agent fields
        "content_score": parsed_json.get("content_score", 20),
        "fluency_score": parsed_json.get("fluency_score", 20),
        "structure_score": parsed_json.get("structure_score", 20),
        "filler_penalty": parsed_json.get("filler_penalty", 0),
        "improve": parsed_json.get("improve", ""),
        "better_line": parsed_json.get("better_line", ""),
        "weak_filler": parsed_json.get("weak_filler", ""),
        "transcript": transcript
    }