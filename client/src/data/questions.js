export const LEVELS = ["Basic", "Medium", "Hard"];

export const topicSlug = (topic) =>
  topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const QUESTIONS = [
  // JavaScript
  { id: "loop", topic: "JavaScript", level: "Basic", text: "What is a loop?" },
  {
    id: "var-let-const",
    topic: "JavaScript",
    level: "Basic",
    text: "What is the difference between var, let, and const?",
  },
  {
    id: "function",
    topic: "JavaScript",
    level: "Basic",
    text: "What is a function?",
  },
  {
    id: "closure",
    topic: "JavaScript",
    level: "Medium",
    text: "What is a closure?",
  },
  {
    id: "equality",
    topic: "JavaScript",
    level: "Medium",
    text: "What is the difference between == and ===?",
  },
  {
    id: "hoisting",
    topic: "JavaScript",
    level: "Medium",
    text: "What is hoisting?",
  },
  {
    id: "event-loop",
    topic: "JavaScript",
    level: "Hard",
    text: "What is the event loop?",
  },
  {
    id: "promise-async",
    topic: "JavaScript",
    level: "Hard",
    text: "What is the difference between a Promise and async/await?",
  },
  {
    id: "prototype",
    topic: "JavaScript",
    level: "Hard",
    text: "What is prototypal inheritance?",
  },

  // Node.js
  { id: "nodejs", topic: "Node.js", level: "Basic", text: "What is Node.js?" },
  { id: "npm", topic: "Node.js", level: "Basic", text: "What is npm?" },
  {
    id: "middleware",
    topic: "Node.js",
    level: "Medium",
    text: "What is middleware?",
  },
  {
    id: "require-import",
    topic: "Node.js",
    level: "Medium",
    text: "What is the difference between require and import?",
  },
  {
    id: "node-concurrency",
    topic: "Node.js",
    level: "Hard",
    text: "How does Node.js handle many requests with a single thread?",
  },
  {
    id: "streams",
    topic: "Node.js",
    level: "Hard",
    text: "What are streams in Node.js?",
  },

  // Auth & APIs
  {
    id: "rest",
    topic: "Auth & APIs",
    level: "Basic",
    text: "What is a REST API?",
  },
  {
    id: "get-post",
    topic: "Auth & APIs",
    level: "Basic",
    text: "What is the difference between GET and POST?",
  },
  { id: "jwt", topic: "Auth & APIs", level: "Medium", text: "What is a JWT?" },
  { id: "cors", topic: "Auth & APIs", level: "Medium", text: "What is CORS?" },
  {
    id: "authn-authz",
    topic: "Auth & APIs",
    level: "Hard",
    text: "What is the difference between authentication and authorization?",
  },
  {
    id: "rate-limiting",
    topic: "Auth & APIs",
    level: "Hard",
    text: "What is rate limiting and why use it?",
  },

  // OOP
  {
    id: "class-object",
    topic: "OOP",
    level: "Basic",
    text: "What is the difference between a class and an object?",
  },
  {
    id: "polymorphism",
    topic: "OOP",
    level: "Medium",
    text: "What is polymorphism?",
  },
  {
    id: "encapsulation",
    topic: "OOP",
    level: "Medium",
    text: "What is encapsulation?",
  },
  {
    id: "composition",
    topic: "OOP",
    level: "Hard",
    text: "What is the difference between composition and inheritance?",
  },
];
