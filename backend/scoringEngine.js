/**
 * AD-DSS Scoring Engine
 * Implements the Weighted Scoring Matrix from the research framework.
 *
 * Dimensions and weights:
 *   Technical    — 32%
 *   Financial    — 22%
 *   Operational  — 46%
 *
 * Risk factors (Likelihood × Impact, max 9 each):
 *   Data breach, System downtime, Internet dependency,
 *   Vendor lock-in, Disaster recovery
 */

// ── Lookup tables ─────────────────────────────────────────────────────────────

const POP_SCORE   = { small: 3, medium: 4, large: 4, xlarge: 5 };
const IT_SCORE    = { none: 1, small: 3, full: 5 };
const HW_SCORE    = { none: 1, old: 2, some: 3, good: 5 };
const PWR_SCORE   = { poor: 1, fair: 3, good: 5 };
const CAPEX_SCORE = { none: 5, low: 4, med: 3, high: 2 };  // higher = less upfront needed (cloud-friendly)
const OPEX_SCORE  = { none: 1, low: 2, med: 4, high: 5 };  // higher = more monthly budget (cloud-friendly)

const CAPEX_PHP   = { none: 0, low: 300000, med: 900000, high: 2000000 };
const OPEX_PHP    = { none: 0, low: 12000, med: 40000, high: 90000 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function norm(v, lo, hi)  { return clamp((v - lo) / (hi - lo) * 5, 0, 5); }
function round2(v)         { return Math.round(v * 100) / 100; }

function netScore(uptime) {
  if (uptime >= 90) return 5;
  if (uptime >= 80) return 4;
  if (uptime >= 70) return 3;
  if (uptime >= 60) return 2;
  return 1;
}

function speedScore(speed) {
  if (speed >= 50) return 5;
  if (speed >= 30) return 4;
  if (speed >= 20) return 3;
  if (speed >= 10) return 2;
  return 1;
}

// ── Feasibility scoring ───────────────────────────────────────────────────────

function scoreTechnical(inputs) {
  const { uptime, speed, students, hw, power, it, scale } = inputs;
  const ns = netScore(uptime);
  const ss = speedScore(speed);

  const cloudRaw = (ns * 0.40 + ss * 0.20 + POP_SCORE[students] * 0.40) * (scale / 5);
  const localRaw = HW_SCORE[hw] * 0.40 + PWR_SCORE[power] * 0.30 + IT_SCORE[it] * 0.30;

  return {
    cloud: round2(norm(cloudRaw, 1, 5)),
    local: round2(norm(localRaw, 1, 5)),
  };
}

function scoreFinancial(inputs) {
  const { capex, opex } = inputs;
  const cs = CAPEX_SCORE[capex];
  const os = OPEX_SCORE[opex];

  const cloudRaw = cs * 0.45 + os * 0.55;
  const localRaw = (6 - cs) * 0.45 + (6 - os) * 0.55;

  return {
    cloud: round2(norm(cloudRaw, 1, 5)),
    local: round2(norm(localRaw, 1, 5)),
  };
}

function scoreOperational(inputs) {
  const { uptime, acc, priv, gov, it } = inputs;
  const ns = netScore(uptime);

  const cloudRaw = acc * 0.35 + (6 - priv) * 0.35 + ns * 0.30;
  const localRaw = gov * 0.35 + priv * 0.35 + IT_SCORE[it] * 0.30;

  return {
    cloud: round2(norm(cloudRaw, 1, 5)),
    local: round2(norm(localRaw, 1, 5)),
  };
}

// ── Risk scoring ──────────────────────────────────────────────────────────────

function scoreRisks(inputs) {
  const { uptime, power, it, priv, capex } = inputs;

  const internetRisk  = uptime >= 90 ? 2 : uptime >= 80 ? 4 : uptime >= 70 ? 6 : 9;
  const vendorRisk    = capex === 'none' || capex === 'low' ? 4 : 3;
  const dataBreachRisk= priv >= 4 ? 5 : 3;
  const downtimeLocal = PWR_SCORE[power] >= 5 ? 2 : PWR_SCORE[power] >= 3 ? 5 : 7;
  const drLocal       = IT_SCORE[it] >= 5 ? 3 : IT_SCORE[it] >= 3 ? 5 : 8;

  const cloudTotal = internetRisk + vendorRisk + dataBreachRisk + 2 + 2;
  const localTotal = 3 + 1 + 2 + downtimeLocal + drLocal;
  const MAX_RISK   = 45;

  const label = (score) => {
    if (score >= 6) return 'High';
    if (score >= 4) return 'Medium';
    if (score >= 2) return 'Low';
    return 'None';
  };

  return {
    factors: [
      { name: 'Data breach',        cloud: dataBreachRisk, local: 3,             cloudLabel: label(dataBreachRisk), localLabel: 'Low'             },
      { name: 'System downtime',    cloud: 2,              local: downtimeLocal,  cloudLabel: 'Low',                 localLabel: label(downtimeLocal) },
      { name: 'Internet dependency',cloud: internetRisk,   local: 0,              cloudLabel: label(internetRisk),   localLabel: 'None'            },
      { name: 'Vendor lock-in',     cloud: vendorRisk,     local: 0,              cloudLabel: label(vendorRisk),     localLabel: 'None'            },
      { name: 'Disaster recovery',  cloud: 2,              local: drLocal,        cloudLabel: 'Low',                 localLabel: label(drLocal)    },
    ],
    totals: {
      cloud: cloudTotal,
      local: localTotal,
      cloudPct: Math.round(cloudTotal / MAX_RISK * 100),
      localPct: Math.round(localTotal / MAX_RISK * 100),
    },
  };
}

// ── 5-year cost projection ────────────────────────────────────────────────────

function projectCosts(inputs) {
  const { capex, opex } = inputs;
  const localBase  = CAPEX_PHP[capex] || 900000;
  const cloudMonthly = OPEX_PHP[opex] || 40000;

  return [1, 2, 3, 4, 5].map(y => ({
    year: `Year ${y}`,
    cloud: Math.round(cloudMonthly * 12 * y),
    local: Math.round(localBase + y * 180000),
  }));
}

// ── Recommendation logic ──────────────────────────────────────────────────────

function recommend(inputs, scores) {
  const { uptime, school } = inputs;
  const name = school || 'Your institution';
  const diff = scores.overall.cloud - scores.overall.local;

  if (uptime < 70) {
    return {
      verdict: 'Local server deployment',
      type: 'local',
      reason: `Internet uptime at ${uptime}% makes cloud dependency a critical risk for ${name}. Local server ensures continuous access through the campus LAN regardless of connectivity — a key finding for Philippine institutions (Morea, 2020).`,
    };
  }

  if (Math.abs(diff) < 0.25) {
    return {
      verdict: 'Conditional hybrid approach',
      type: 'hybrid',
      reason: `Feasibility scores are very close (Cloud: ${scores.overall.cloud.toFixed(2)} vs Local: ${scores.overall.local.toFixed(2)}). A phased deployment — cloud-based access for remote stakeholders with local server for sensitive data governance — may best serve ${name}.`,
    };
  }

  if (diff > 0) {
    return {
      verdict: 'Cloud-based deployment',
      type: 'cloud',
      reason: `Cloud scores higher overall (${scores.overall.cloud.toFixed(2)} vs ${scores.overall.local.toFixed(2)}) for ${name}. Your internet reliability and financial model support cloud adoption, providing better scalability and lower maintenance burden.`,
    };
  }

  return {
    verdict: 'Local server deployment',
    type: 'local',
    reason: `Local server scores higher overall (${scores.overall.local.toFixed(2)} vs ${scores.overall.cloud.toFixed(2)}) for ${name}. Your data governance priorities and infrastructure capacity favor on-premise deployment.`,
  };
}

// ── Main entry point ──────────────────────────────────────────────────────────

function runAnalysis(inputs) {
  const technical   = scoreTechnical(inputs);
  const financial   = scoreFinancial(inputs);
  const operational = scoreOperational(inputs);
  const risks       = scoreRisks(inputs);
  const costs       = projectCosts(inputs);

  const WEIGHTS = { technical: 0.32, financial: 0.22, operational: 0.46 };

  const overall = {
    cloud: round2(
      technical.cloud   * WEIGHTS.technical  +
      financial.cloud   * WEIGHTS.financial  +
      operational.cloud * WEIGHTS.operational
    ),
    local: round2(
      technical.local   * WEIGHTS.technical  +
      financial.local   * WEIGHTS.financial  +
      operational.local * WEIGHTS.operational
    ),
  };

  const scores = { technical, financial, operational, overall };
  const recommendation = recommend(inputs, scores);

  return { scores, risks, costs, recommendation };
}

module.exports = { runAnalysis };
