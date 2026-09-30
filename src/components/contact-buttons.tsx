import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { Button } from "@/components/ui/button";
import { whatsappLink, withPortal } from "@/lib/whatsapp";

/** Link to the in-app chat with `text` already in the box. */
export const messageHref = (clientId: string, text?: string) =>
  text ? `/mesajlar/${clientId}?taslak=${encodeURIComponent(text)}` : `/mesajlar/${clientId}`;

/**
 * The two ways to reach a client from a list row: the in-app message first
 * (it lands on their page, as a push if they allow it), WhatsApp second.
 * Both open with the same ready-made text; WhatsApp also gets the page link.
 */
export function ContactButtons({
  clientId,
  name,
  phone,
  text,
  portal,
}: {
  clientId: string;
  name: string;
  phone: string | null;
  text: string;
  portal?: string | null;
}) {
  const wa = whatsappLink(phone, withPortal(text, portal));
  return (
    <span className="flex shrink-0 items-center gap-1">
      {wa && (
        <Button asChild size="icon" variant="ghost" className="text-muted-foreground" aria-label={`${name} ile WhatsApp'ta yazış`}>
          <a href={wa} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon />
          </a>
        </Button>
      )}
      <Button asChild size="icon" variant="outline" aria-label={`${name} için mesaj yaz`}>
        <Link href={messageHref(clientId, text)}>
          <MessagesSquare />
        </Link>
      </Button>
    </span>
  );
}
