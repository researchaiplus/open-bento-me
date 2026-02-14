import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;
  const decodedId = decodeURIComponent(id);

  try {
    // type is either "models" or "datasets"
    const isDataset = type === 'datasets';
    const hfApiUrl = isDataset
      ? `https://huggingface.co/api/datasets/${decodedId}`
      : `https://huggingface.co/api/models/${decodedId}`;

    const response = await fetch(hfApiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `HF API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('HF API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from HuggingFace' },
      { status: 500 }
    );
  }
}
