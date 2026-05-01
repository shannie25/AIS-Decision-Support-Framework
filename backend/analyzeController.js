const { runAnalysis } = require('./scoringEngine');
const { db } = require('./firebase');

const VALID = {
  students:  ['small', 'medium', 'large', 'xlarge'],
  staff:     ['small', 'medium', 'large'],
  it:        ['none', 'small', 'full'],
  itype:     ['private', 'public'],
  hw:        ['none', 'old', 'some', 'good'],
  power:     ['poor', 'fair', 'good'],
  capex:     ['none', 'low', 'med', 'high'],
  opex:      ['none', 'low', 'med', 'high'],
  costpref:  ['capex', 'opex', 'neutral'],
};

function validate(body) {
  const errors = [];

  // Numeric ranges
  const uptime = Number(body.uptime);
  const speed  = Number(body.speed);
  const gov    = Number(body.gov);
  const acc    = Number(body.acc);
  const priv   = Number(body.priv);
  const scale  = Number(body.scale);

  if (isNaN(uptime) || uptime < 40 || uptime > 100)  errors.push('uptime must be 40–100');
  if (isNaN(speed)  || speed  < 1  || speed  > 200)  errors.push('speed must be 1–200');
  if (isNaN(gov)    || gov    < 1  || gov    > 5)     errors.push('gov must be 1–5');
  if (isNaN(acc)    || acc    < 1  || acc    > 5)     errors.push('acc must be 1–5');
  if (isNaN(priv)   || priv   < 1  || priv   > 5)     errors.push('priv must be 1–5');
  if (isNaN(scale)  || scale  < 1  || scale  > 5)     errors.push('scale must be 1–5');

  // Enum fields
  for (const [key, allowed] of Object.entries(VALID)) {
    if (!allowed.includes(body[key])) {
      errors.push(`${key} must be one of: ${allowed.join(', ')}`);
    }
  }

  return errors;
}

async function analyzeController(req, res) {
  try {
    const errors = validate(req.body);
    if (errors.length) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const inputs = {
      school:    (req.body.school || '').trim().slice(0, 100) || 'Unknown institution',
      uptime:    Number(req.body.uptime),
      speed:     Number(req.body.speed),
      students:  req.body.students,
      staff:     req.body.staff,
      it:        req.body.it,
      itype:     req.body.itype,
      hw:        req.body.hw,
      power:     req.body.power,
      capex:     req.body.capex,
      opex:      req.body.opex,
      costpref:  req.body.costpref,
      gov:       Number(req.body.gov),
      acc:       Number(req.body.acc),
      priv:      Number(req.body.priv),
      scale:     Number(req.body.scale),
    };

    // Run analysis
    const result = runAnalysis(inputs);

    // Try to save to Firestore, but continue if it fails
    let resultId = 'temp-' + Date.now();
    try {
      const docRef = await db.collection('results').add({
        inputs,
        ...result,
        createdAt: new Date().toISOString(),
      });
      resultId = docRef.id;
    } catch (firestoreErr) {
      console.warn('Firestore unavailable, using temporary ID:', resultId, firestoreErr.message);
    }

    return res.status(200).json({
      id: resultId,
      inputs,
      ...result,
    });
  } catch (err) {
    console.error('analyzeController error:', err);
    return res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
}

module.exports = { analyzeController };
