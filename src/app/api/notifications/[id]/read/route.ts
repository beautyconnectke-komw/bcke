import { NextResponse } from "next/server";
import { markNotificationRead } from "@/lib/domain/beauty-connect";
import { AuthenticationRequiredError, DomainError } from "@/lib/domain/errors";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await markNotificationRead({ notificationId: id });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return NextResponse.json(
        { message: "Authentication is required." },
        { status: 401 },
      );
    }

    if (error instanceof DomainError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Unable to mark the notification as read." },
      { status: 500 },
    );
  }
}
