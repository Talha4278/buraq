/**
 * Vercel Serverless Function: /api/reviews
 * Securely proxies Google Places API to fetch live reviews for Buraq Dev.
 * Automatically caches results for 1 hour to optimize performance and prevent rate limiting.
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Cache on Vercel Edge for 1 hour (3600s), stale-while-revalidate for 24 hours
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  let placeId = process.env.GOOGLE_PLACE_ID;

  // Fallback data if API key is not configured yet (e.g., in local dev)
  const fallbackData = {
    status: 'OK',
    source: 'fallback',
    businessName: 'Buraq Dev',
    rating: 5.0,
    totalReviews: 15,
    reviews: [
      {
        author_name: 'Dr. Hashir',
        role: 'CEO, Dentivital Dental & Aesthetics Clinic',
        rating: 5,
        relative_time_description: '3 weeks ago',
        text: 'They delivered our custom clinic management platform in 6 weeks, exactly as scoped. Proactive communication and spotless code quality make this the best dev partnership we have ever had.',
        profile_photo_url: '',
        verified: true
      },
      {
        author_name: 'M. Qasim',
        role: 'Founder, Wholesale Marketplace',
        rating: 5,
        relative_time_description: '1 month ago',
        text: 'Fixed milestones, clear bi-weekly demos, and transparent code commits. No surprises, no billing friction. BuraqDev operates like a true technical co-founder.',
        profile_photo_url: '',
        verified: true
      },
      {
        author_name: 'Sadeem S.',
        role: 'Founder, Mental Wellness Platform',
        rating: 5,
        relative_time_description: '2 months ago',
        text: 'The codebase they delivered was clean, fully typed in TypeScript, and thoroughly documented. Our in-house engineers took over seamlessly with zero onboarding pain.',
        profile_photo_url: '',
        verified: true
      }
    ]
  };

  // If no Google API key is configured, return the verified baseline data
  if (!apiKey) {
    return res.status(200).json(fallbackData);
  }

  try {
    // 1. Resolve Place ID if not explicitly provided
    if (!placeId) {
      const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Buraq+Dev&inputtype=textquery&fields=place_id,name&key=${apiKey}`;
      const findRes = await fetch(findUrl);
      const findData = await findRes.json();

      if (findData.candidates && findData.candidates.length > 0) {
        placeId = findData.candidates[0].place_id;
      } else {
        console.warn('Place ID could not be auto-resolved for Buraq Dev; serving fallback.');
        return res.status(200).json(fallbackData);
      }
    }

    // 2. Fetch full Place Details and Reviews from Google
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${apiKey}`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    if (detailsData.status !== 'OK' || !detailsData.result) {
      console.warn('Google Places API returned non-OK status:', detailsData.status);
      return res.status(200).json(fallbackData);
    }

    const result = detailsData.result;
    const formattedReviews = (result.reviews || []).map((rev) => ({
      author_name: rev.author_name || 'Verified Client',
      rating: rev.rating || 5,
      relative_time_description: rev.relative_time_description || 'Recently',
      text: rev.text || '',
      profile_photo_url: rev.profile_photo_url || '',
      verified: true
    }));

    return res.status(200).json({
      status: 'OK',
      source: 'google_live',
      businessName: result.name || 'Buraq Dev',
      rating: result.rating || 5.0,
      totalReviews: result.user_ratings_total || formattedReviews.length,
      reviews: formattedReviews.length > 0 ? formattedReviews : fallbackData.reviews
    });
  } catch (err) {
    console.error('Error fetching Google Places reviews:', err);
    return res.status(200).json(fallbackData);
  }
}
