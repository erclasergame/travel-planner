import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const XATA_API_KEY = process.env.XATA_API_KEY;
    const XATA_DB_URL = process.env.XATA_DATABASE_URL || 'https://testdaniele77-1-s-workspace-j00f29.eu-central-1.xata.sh/db/travel_planner:main';
    
    if (!XATA_API_KEY) {
      return Response.json({ error: 'Database not configured' }, { status: 500 });
    }
    
    const response = await fetch(`${XATA_DB_URL}/tables/events/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: { size: 50 }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Xata API error: ${response.status}`);
    }
    
    const data = await response.json();
    return Response.json({
      records: data.records || [],
      total: data.meta?.page?.more ? '50+' : data.records?.length || 0
    });
    
  } catch (error: any) {
    console.error('Events API error:', error);
    return Response.json({ 
      error: 'Failed to fetch events', 
      details: error.message 
    }, { status: 500 });
  }
}