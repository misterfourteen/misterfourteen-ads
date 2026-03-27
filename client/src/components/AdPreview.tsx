import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ThumbsUp, Share2 } from "lucide-react";

interface AdPreviewProps {
  businessName?: string;
  logoUrl?: string;
  primaryText?: string;
  headline?: string;
  description?: string;
  callToAction?: string;
  imageUrl?: string;
  platform?: "instagram_feed" | "instagram_story" | "facebook_feed";
}

export default function AdPreview({
  businessName = "Tu Negocio",
  logoUrl,
  primaryText = "Tu copy publicitario aparecerá aquí. Genera uno con la IA para ver cómo queda.",
  headline = "Tu titular aquí",
  description = "Descripción del anuncio",
  callToAction = "Más información",
  imageUrl,
  platform = "instagram_feed",
}: AdPreviewProps) {
  const [activePlatform, setActivePlatform] = useState(platform);

  const platforms = [
    { id: "instagram_feed", label: "IG Feed" },
    { id: "instagram_story", label: "IG Story" },
    { id: "facebook_feed", label: "FB Feed" },
  ] as const;

  return (
    <div className="space-y-3">
      {/* Platform selector */}
      <div className="flex gap-2">
        {platforms.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePlatform(p.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              activePlatform === p.id
                ? "bg-primary border-primary text-white"
                : "border-gray-700 text-gray-400 hover:border-gray-500"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Preview container */}
      <div className="flex justify-center">
        {activePlatform === "instagram_story" ? (
          <InstagramStoryPreview
            businessName={businessName}
            logoUrl={logoUrl}
            primaryText={primaryText}
            callToAction={callToAction}
            imageUrl={imageUrl}
          />
        ) : activePlatform === "facebook_feed" ? (
          <FacebookFeedPreview
            businessName={businessName}
            logoUrl={logoUrl}
            primaryText={primaryText}
            headline={headline}
            description={description}
            callToAction={callToAction}
            imageUrl={imageUrl}
          />
        ) : (
          <InstagramFeedPreview
            businessName={businessName}
            logoUrl={logoUrl}
            primaryText={primaryText}
            headline={headline}
            callToAction={callToAction}
            imageUrl={imageUrl}
          />
        )}
      </div>
    </div>
  );
}

function InstagramFeedPreview({ businessName, logoUrl, primaryText, headline, callToAction, imageUrl }: Omit<AdPreviewProps, "platform" | "description">) {
  return (
    <div className="w-[320px] bg-white rounded-xl overflow-hidden shadow-2xl font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xs font-bold">
                {businessName?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 leading-tight">{businessName}</p>
            <p className="text-[10px] text-gray-500">Publicidad · Patrocinado</p>
          </div>
        </div>
        <MoreHorizontal className="w-4 h-4 text-gray-500" />
      </div>

      {/* Image */}
      <div className="w-full aspect-square bg-gradient-to-br from-gray-800 to-gray-900 relative">
        {imageUrl ? (
          <img src={imageUrl} alt="Ad creative" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-600 text-xs text-center px-4">Imagen del anuncio</p>
          </div>
        )}
      </div>

      {/* CTA bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 truncate">{headline}</p>
          <p className="text-[10px] text-gray-500">misterfourteen.com</p>
        </div>
        <button className="flex-shrink-0 bg-gray-100 text-gray-800 text-[11px] font-semibold px-3 py-1.5 rounded ml-2">
          {callToAction}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3">
          <Heart className="w-5 h-5 text-gray-700" />
          <MessageCircle className="w-5 h-5 text-gray-700" />
          <Send className="w-5 h-5 text-gray-700" />
        </div>
        <Bookmark className="w-5 h-5 text-gray-700" />
      </div>

      {/* Caption */}
      <div className="px-3 pb-3">
        <p className="text-[11px] text-gray-700 leading-relaxed line-clamp-3">
          <span className="font-semibold">{businessName} </span>
          {primaryText}
        </p>
      </div>
    </div>
  );
}

function InstagramStoryPreview({ businessName, logoUrl, primaryText, callToAction, imageUrl }: Omit<AdPreviewProps, "platform" | "headline" | "description">) {
  return (
    <div className="w-[200px] h-[356px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {imageUrl && (
        <img src={imageUrl} alt="Ad creative" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

      {/* Header */}
      <div className="absolute top-3 left-3 right-3 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center ring-2 ring-white overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-[10px] font-bold">
              {businessName?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className="text-white text-[10px] font-semibold leading-tight">{businessName}</p>
          <p className="text-white/60 text-[9px]">Patrocinado</p>
        </div>
      </div>

      {/* Text */}
      <div className="absolute bottom-12 left-3 right-3">
        <p className="text-white text-[11px] leading-relaxed line-clamp-4 drop-shadow-lg">
          {primaryText}
        </p>
      </div>

      {/* CTA */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center">
        <button className="bg-white text-gray-900 text-[11px] font-bold px-4 py-1.5 rounded-full w-full">
          {callToAction} ↑
        </button>
      </div>
    </div>
  );
}

function FacebookFeedPreview({ businessName, logoUrl, primaryText, headline, description, callToAction, imageUrl }: Omit<AdPreviewProps, "platform">) {
  return (
    <div className="w-[320px] bg-white rounded-xl overflow-hidden shadow-2xl font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-sm font-bold">
                {businessName?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 leading-tight">{businessName}</p>
            <div className="flex items-center gap-1">
              <p className="text-[10px] text-gray-500">Patrocinado</p>
              <span className="text-gray-400">·</span>
              <Badge className="text-[9px] bg-blue-50 text-blue-600 border-0 px-1 py-0 h-auto">
                Seguir
              </Badge>
            </div>
          </div>
        </div>
        <MoreHorizontal className="w-4 h-4 text-gray-500" />
      </div>

      {/* Primary text */}
      <div className="px-3 pb-2">
        <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{primaryText}</p>
      </div>

      {/* Image */}
      <div className="w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative">
        {imageUrl ? (
          <img src={imageUrl} alt="Ad creative" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-600 text-xs">Imagen del anuncio</p>
          </div>
        )}
      </div>

      {/* Link preview */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-t border-gray-100">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">misterfourteen.com</p>
          <p className="text-xs font-semibold text-gray-900 truncate">{headline}</p>
          <p className="text-[10px] text-gray-500 truncate">{description}</p>
        </div>
        <button className="flex-shrink-0 bg-gray-200 text-gray-800 text-[11px] font-semibold px-3 py-1.5 rounded ml-2">
          {callToAction}
        </button>
      </div>

      {/* Reactions */}
      <div className="px-3 py-2 flex items-center gap-4 border-t border-gray-100">
        <button className="flex items-center gap-1 text-gray-500 text-xs">
          <ThumbsUp className="w-4 h-4" /> Me gusta
        </button>
        <button className="flex items-center gap-1 text-gray-500 text-xs">
          <MessageCircle className="w-4 h-4" /> Comentar
        </button>
        <button className="flex items-center gap-1 text-gray-500 text-xs">
          <Share2 className="w-4 h-4" /> Compartir
        </button>
      </div>
    </div>
  );
}
