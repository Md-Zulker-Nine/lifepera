const fs = require('fs');

const topics = [
  {
    title: 'How to compare total compensation across job offers',
    category: 'Career',
    keywords: 'base salary, benefits, paid leave, equity, offer comparison checklist',
  },
  {
    title: 'How to check a rental listing before paying a deposit',
    category: 'Life decisions',
    keywords: 'rental scams, lease terms, property viewing, deposit receipt, local tenant resources',
  },
  {
    title: 'How to plan a multi-city trip budget',
    category: 'Travel',
    keywords: 'transport between cities, accommodation, daily costs, travel contingency',
  },
  {
    title: 'What to document before raising a workplace concern',
    category: 'Career',
    keywords: 'dates, observable events, workplace policies, record keeping, reporting options',
  },
  {
    title: 'Questions to ask before a first therapy appointment',
    category: 'Wellbeing',
    keywords: 'credentials, fees, confidentiality, treatment approach, practical preparation',
  },
  {
    title: 'How to estimate the cost of an international move',
    category: 'Travel',
    keywords: 'shipping, temporary housing, travel documents, insurance, local setup costs',
  },
  {
    title: 'How to compare health insurance when you freelance',
    category: 'Finance',
    keywords: 'premiums, deductibles, provider networks, local rules, plan comparison',
  },
  {
    title: 'How to make a weekly food budget using local prices',
    category: 'Finance',
    keywords: 'meal planning, grocery prices, household needs, flexible spending plan',
  },
  {
    title: 'What to check when your passport expires before a trip',
    category: 'Travel',
    keywords: 'passport validity, transit rules, destination entry requirements, official sources',
  },
  {
    title: 'How to evaluate a job offer with variable pay',
    category: 'Career',
    keywords: 'commission, bonus conditions, equity, written offer, guaranteed compensation',
  },
  {
    title: 'How to split shared household bills when incomes differ',
    category: 'Relationships',
    keywords: 'shared expenses, proportional contributions, consent, review dates, practical examples',
  },
  {
    title: 'Building an emergency fund with irregular income',
    category: 'Finance',
    keywords: 'variable income, essential expenses, savings milestones, cash-flow planning',
  },
  {
    title: 'How to verify visa rules for a specific itinerary',
    category: 'Travel',
    keywords: 'passport nationality, transit, purpose of visit, stay length, government sources',
  },
  {
    title: 'How to estimate the full cost of commuting to work',
    category: 'Career',
    keywords: 'transport, parking, meals, travel time, work schedule, personal calculation',
  },
  {
    title: 'Comparing remote and office job offers beyond salary',
    category: 'Career',
    keywords: 'commute, equipment, flexibility, benefits, work expectations, decision checklist',
  },
  {
    title: 'How to prepare for a salary discussion with comparable data',
    category: 'Career',
    keywords: 'role scope, location, seniority, compensation definitions, source quality',
  },
  {
    title: 'What to consider before turning a hobby into income',
    category: 'Career',
    keywords: 'costs, time, demand, taxes, enjoyment, low-risk trial',
  },
  {
    title: 'A practical checklist for reviewing recurring subscriptions',
    category: 'Finance',
    keywords: 'billing dates, trial periods, cancellation terms, shared plans, spending review',
  },
];

const millisecondsPerDay = 24 * 60 * 60 * 1000;
const anchorDay = Math.floor(Date.UTC(2026, 9, 4) / millisecondsPerDay);
const dateOverride = process.env.TOPIC_DATE;
const today = dateOverride
  ? Math.floor(Date.parse(`${dateOverride}T00:00:00Z`) / millisecondsPerDay)
  : Math.floor(Date.now() / millisecondsPerDay);
const daysSinceAnchor = today - anchorDay;
const shouldRun = daysSinceAnchor >= 0 && daysSinceAnchor % 2 === 0;

const outputs = [`run=${shouldRun}`];
if (shouldRun) {
  const topic = topics[Math.floor(daysSinceAnchor / 2) % topics.length];
  outputs.push(`intent=${topic.title}`, `category=${topic.category}`, `keywords=${topic.keywords}`);
}

const output = `${outputs.join('\n')}\n`;
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, output);
} else {
  process.stdout.write(output);
}
