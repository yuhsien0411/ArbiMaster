import axios from 'axios';

const ALTERNATIVE_API_URL = 'https://api.alternative.me/fng/';

export default async function handler(req, res) {
  try {
    const response = await axios.get(ALTERNATIVE_API_URL);
    const data = response.data;

    if (!data || !data.data || !data.data[0]) {
      throw new Error('Invalid data structure received from API');
    }

    const fearGreedData = {
      value: parseInt(data.data[0].value),
      valueClassification: data.data[0].value_classification,
      timestamp: data.data[0].timestamp,
      timeUntilUpdate: data.data[0].time_until_update
    };

    res.status(200).json(fearGreedData);
  } catch (error) {
    console.error('Error fetching fear and greed index:', error);
    res.status(500).json({ error: 'Failed to fetch fear and greed index' });
  }
} 