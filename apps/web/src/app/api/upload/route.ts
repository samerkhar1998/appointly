import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/jwt';

// Cloudinary is configured once at module load from env vars.
cloudinary.config({
  cloud_name: process.env['CLOUDINARY_CLOUD_NAME'],
  api_key: process.env['CLOUDINARY_API_KEY'],
  api_secret: process.env['CLOUDINARY_API_SECRET'],
});

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_FOLDERS = ['salons', 'staff', 'products', 'bug-reports'] as const;
type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

// Folders that do not require a logged-in session (anyone can upload)
const PUBLIC_FOLDERS: AllowedFolder[] = ['bug-reports'];

// POST /api/upload
// Accepts a multipart FormData body with:
//   file   — the image file to upload
//   folder — one of: salons | staff | products | bug-reports
// Returns { url: string, public_id: string } on success.
export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── Parse FormData early so we know the folder before auth check ────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const folderRaw = formData.get('folder') as string | null;
  const isPublicFolder = PUBLIC_FOLDERS.includes(folderRaw as AllowedFolder);

  // ── Auth (skipped for public folders) ──────────────────────────────────────
  if (!isPublicFolder) {
    const cookieStore = await cookies();
    const token = cookieStore.get('appointly_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }
  }

  // ── Read fields from already-parsed FormData ────────────────────────────────
  const file = formData.get('file');
  const folderRaw2 = formData.get('folder');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // ── Validate ────────────────────────────────────────────────────────────────
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only JPEG, PNG, WebP, and GIF images are allowed' },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large — maximum is 10 MB' }, { status: 400 });
  }

  const folder: AllowedFolder = ALLOWED_FOLDERS.includes(folderRaw2 as AllowedFolder)
    ? (folderRaw2 as AllowedFolder)
    : 'salons';

  // ── Upload to Cloudinary ────────────────────────────────────────────────────
  if (
    !process.env['CLOUDINARY_CLOUD_NAME'] ||
    !process.env['CLOUDINARY_API_KEY'] ||
    !process.env['CLOUDINARY_API_SECRET']
  ) {
    // Return a stub URL in development when Cloudinary is not configured.
    return NextResponse.json({
      url: `https://placehold.co/400?text=dev`,
      public_id: 'dev/placeholder',
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');
  const dataUri = `data:${file.type};base64,${base64}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `appointly/${folder}`,
      resource_type: 'image',
      transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
    });

    return NextResponse.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
