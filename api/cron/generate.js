export default async function handler(req, res) {
  try {
    const response = await fetch(
      'https://nocturna-automation.vercel.app/api/generate-short',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }
    );
    const data = await response.json();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const config = {
  maxDuration: 30,
};
