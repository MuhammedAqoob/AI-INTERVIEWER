const { BRANCHES } = require('../../constants/branches');
const { INTERVIEW_TYPES } = require('../../constants/interviewTypes');
const { DIFFICULTY } = require('../../constants/difficulty');

const localQuestions = {
  [BRANCHES.COMPUTER_SCIENCE]: {
    [INTERVIEW_TYPES.TECHNICAL]: [
      { content: 'What is Object-Oriented Programming?', difficulty: DIFFICULTY.EASY },
      { content: 'Explain the difference between a stack and a queue.', difficulty: DIFFICULTY.EASY },
      { content: 'What is a linked list? When would you use one over an array?', difficulty: DIFFICULTY.EASY },
      { content: 'What is a database index and why is it important?', difficulty: DIFFICULTY.EASY },
      { content: 'Explain the concept of recursion with an example.', difficulty: DIFFICULTY.EASY },
      { content: 'What is the difference between TCP and UDP?', difficulty: DIFFICULTY.EASY },
      { content: 'What is a hash table and how does it handle collisions?', difficulty: DIFFICULTY.MEDIUM },
      { content: 'Explain the difference between processes and threads.', difficulty: DIFFICULTY.MEDIUM },
      { content: 'What is a deadlock? How do you prevent it?', difficulty: DIFFICULTY.MEDIUM },
      { content: 'Explain the CAP theorem in distributed systems.', difficulty: DIFFICULTY.MEDIUM },
      { content: 'What is the difference between SQL and NoSQL databases?', difficulty: DIFFICULTY.MEDIUM },
      { content: 'Explain how garbage collection works in Java or Python.', difficulty: DIFFICULTY.MEDIUM },
      { content: 'What are design patterns? Explain Singleton and Factory.', difficulty: DIFFICULTY.MEDIUM },
      { content: 'Explain the concept of virtual memory and paging.', difficulty: DIFFICULTY.HARD },
      { content: 'What is consensus in distributed systems? Explain Raft or Paxos.', difficulty: DIFFICULTY.HARD },
      { content: 'Explain the difference between concurrency and parallelism.', difficulty: DIFFICULTY.HARD },
    ],
    [INTERVIEW_TYPES.HR]: [],
    [INTERVIEW_TYPES.APTITUDE]: [],
  },

  [BRANCHES.ELECTRONICS]: {
    [INTERVIEW_TYPES.TECHNICAL]: [
      { content: 'What is a diode? Explain its working principle.', difficulty: DIFFICULTY.EASY },
      { content: 'What is the difference between analog and digital signals?', difficulty: DIFFICULTY.EASY },
      { content: 'Explain Ohm\'s law and its applications.', difficulty: DIFFICULTY.EASY },
      { content: 'What is a transistor? Explain its modes of operation.', difficulty: DIFFICULTY.MEDIUM },
      { content: 'What is a flip-flop? Explain SR, JK, and D flip-flops.', difficulty: DIFFICULTY.MEDIUM },
      { content: 'Explain the working of a full-wave rectifier.', difficulty: DIFFICULTY.MEDIUM },
      { content: 'What is an operational amplifier? Explain its applications.', difficulty: DIFFICULTY.MEDIUM },
      { content: 'What is modulation? Compare AM and FM.', difficulty: DIFFICULTY.HARD },
      { content: 'Explain the concept of impedance matching.', difficulty: DIFFICULTY.HARD },
    ],
    [INTERVIEW_TYPES.HR]: [],
    [INTERVIEW_TYPES.APTITUDE]: [],
  },

  [BRANCHES.MECHANICAL]: {
    [INTERVIEW_TYPES.TECHNICAL]: [
      { content: 'What is the difference between heat and temperature?', difficulty: DIFFICULTY.EASY },
      { content: 'Explain the laws of thermodynamics briefly.', difficulty: DIFFICULTY.EASY },
      { content: 'What is stress and strain? Explain the stress-strain curve.', difficulty: DIFFICULTY.EASY },
      { content: 'What is the difference between forging, casting, and machining?', difficulty: DIFFICULTY.MEDIUM },
      { content: 'Explain the working principle of a Carnot engine.', difficulty: DIFFICULTY.MEDIUM },
      { content: 'What is fatigue failure? How do you prevent it?', difficulty: DIFFICULTY.MEDIUM },
      { content: 'Explain Bernoulli\'s theorem and its applications.', difficulty: DIFFICULTY.HARD },
      { content: 'What is the difference between laminar and turbulent flow?', difficulty: DIFFICULTY.HARD },
    ],
    [INTERVIEW_TYPES.HR]: [],
    [INTERVIEW_TYPES.APTITUDE]: [],
  },

  [BRANCHES.CIVIL]: {
    [INTERVIEW_TYPES.TECHNICAL]: [
      { content: 'What is the difference between one-way and two-way slabs?', difficulty: DIFFICULTY.EASY },
      { content: 'Explain the basic principles of surveying.', difficulty: DIFFICULTY.EASY },
      { content: 'What are the types of foundations? When do you use each?', difficulty: DIFFICULTY.MEDIUM },
      { content: 'What is the difference between working stress method and limit state method?', difficulty: DIFFICULTY.MEDIUM },
      { content: 'Explain the properties of fresh and hardened concrete.', difficulty: DIFFICULTY.MEDIUM },
      { content: 'What is soil bearing capacity and how is it determined?', difficulty: DIFFICULTY.HARD },
      { content: 'Explain the concept of prestressed concrete.', difficulty: DIFFICULTY.HARD },
    ],
    [INTERVIEW_TYPES.HR]: [],
    [INTERVIEW_TYPES.APTITUDE]: [],
  },

  [BRANCHES.ELECTRICAL]: {
    [INTERVIEW_TYPES.TECHNICAL]: [
      { content: 'What is the difference between AC and DC current?', difficulty: DIFFICULTY.EASY },
      { content: 'Explain Kirchhoff\'s voltage and current laws.', difficulty: DIFFICULTY.EASY },
      { content: 'What is a transformer? Explain its working principle.', difficulty: DIFFICULTY.EASY },
      { content: 'What is power factor? Why is it important?', difficulty: DIFFICULTY.MEDIUM },
      { content: 'Explain the working of a three-phase induction motor.', difficulty: DIFFICULTY.MEDIUM },
      { content: 'What is the difference between star and delta connections?', difficulty: DIFFICULTY.MEDIUM },
      { content: 'Explain the concept of symmetrical components in power systems.', difficulty: DIFFICULTY.HARD },
      { content: 'What is load flow analysis? Why is it performed?', difficulty: DIFFICULTY.HARD },
    ],
    [INTERVIEW_TYPES.HR]: [],
    [INTERVIEW_TYPES.APTITUDE]: [],
  },

  GLOBAL: {
    [INTERVIEW_TYPES.HR]: [
      { content: 'Tell me about yourself.', difficulty: DIFFICULTY.EASY },
      { content: 'Why should we hire you for this role?', difficulty: DIFFICULTY.EASY },
      { content: 'What are your greatest strengths?', difficulty: DIFFICULTY.EASY },
      { content: 'Describe a challenging project you worked on and how you handled it.', difficulty: DIFFICULTY.MEDIUM },
      { content: 'Where do you see yourself in five years?', difficulty: DIFFICULTY.EASY },
      { content: 'How do you handle pressure and tight deadlines?', difficulty: DIFFICULTY.MEDIUM },
      { content: 'Tell me about a time you failed. What did you learn?', difficulty: DIFFICULTY.MEDIUM },
      { content: 'Why are you leaving your current job?', difficulty: DIFFICULTY.EASY },
      { content: 'How do you handle conflict with a coworker?', difficulty: DIFFICULTY.MEDIUM },
      { content: 'What motivates you in your work?', difficulty: DIFFICULTY.EASY },
    ],
    [INTERVIEW_TYPES.APTITUDE]: [
      { content: 'If a train travels 360 km in 4 hours, what is its average speed?', difficulty: DIFFICULTY.EASY },
      { content: 'What comes next in the sequence: 2, 6, 12, 20, 30, ?', difficulty: DIFFICULTY.EASY },
      { content: 'A boat can travel 20 km upstream in 5 hours and 20 km downstream in 2 hours. What is the speed of the current?', difficulty: DIFFICULTY.MEDIUM },
      { content: 'If the ratio of ages of A and B is 3:5 and the sum of their ages is 48, find their ages.', difficulty: DIFFICULTY.EASY },
      { content: 'A pipe can fill a tank in 12 hours and another can empty it in 15 hours. If both are open, how long will it take to fill the tank?', difficulty: DIFFICULTY.MEDIUM },
      { content: 'What is the probability of getting at least one head when three coins are tossed?', difficulty: DIFFICULTY.MEDIUM },
      { content: 'A shopkeeper marks up a product by 40% and gives a 20% discount. What is the profit percentage?', difficulty: DIFFICULTY.EASY },
      { content: 'Find the compound interest on Rs. 10,000 at 10% per annum for 3 years compounded annually.', difficulty: DIFFICULTY.MEDIUM },
    ],
  },
};

module.exports = localQuestions;
