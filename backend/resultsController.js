const { db } = require('./firebase');

async function getResult(req, res) {
  try {
    const id = req.params.id;
    
    // Handle temporary results (when Firestore is unavailable)
    if (id.startsWith('temp-')) {
      return res.status(400).json({ 
        error: 'Temporary result',
        message: 'This is a temporary result ID. Results are not persisted when the database is unavailable. Please run a new analysis.',
        id 
      });
    }
    
    const doc = await db.collection('results').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Result not found' });
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('getResult error:', err);
    return res.status(500).json({ error: 'Failed to fetch result' });
  }
}

async function listResults(req, res) {
  try {
    const snapshot = await db.collection('results')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json(results);
  } catch (err) {
    console.error('listResults error:', err);
    return res.status(500).json({ error: 'Failed to list results' });
  }
}

module.exports = { getResult, listResults };
