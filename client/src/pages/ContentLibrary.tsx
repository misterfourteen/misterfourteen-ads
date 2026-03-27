import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Heart,
  Copy,
  Download,
  Search,
  FileText,
  Video,
  Image,
  Star,
  Trash2,
  Filter,
} from "lucide-react";

type ContentType = "all" | "copy" | "script" | "image";

export default function ContentLibrary() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ContentType>("all");

  const { data: contents, refetch } = trpc.generate.history.useQuery({
    type: activeTab === "all" ? undefined : activeTab,
  });

  const toggleFavorite = trpc.generate.toggleFavorite.useMutation({
    onSuccess: () => refetch(),
  });

  type ContentItem = NonNullable<typeof contents>[number];
  const filtered = (contents ?? []).filter((c: ContentItem) => {
    if (!search) return true;
    const text = (c.content ?? c.imagePrompt ?? "").toLowerCase();
    return text.includes(search.toLowerCase());
  });

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  }

  function downloadContent(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const typeIcon = (type: string) => {
    if (type === "copy") return <FileText className="w-4 h-4" />;
    if (type === "script") return <Video className="w-4 h-4" />;
    return <Image className="w-4 h-4" />;
  };

  const typeLabel = (type: string) => {
    if (type === "copy") return "Copy";
    if (type === "script") return "Guión";
    return "Imagen";
  };

  const typeColor = (type: string) => {
    if (type === "copy") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (type === "script") return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Biblioteca de Contenidos</h1>
            <p className="text-gray-400 mt-1">Todos tus copies, guiones e imágenes generados</p>
          </div>
          <Badge variant="outline" className="text-gray-400 border-gray-600">
            {filtered.length} contenidos
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Buscar en tu biblioteca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentType)}>
          <TabsList className="bg-gray-900 border border-gray-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Todos
            </TabsTrigger>
            <TabsTrigger value="copy" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileText className="w-3 h-3 mr-1" /> Copies
            </TabsTrigger>
            <TabsTrigger value="script" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Video className="w-3 h-3 mr-1" /> Guiones
            </TabsTrigger>
            <TabsTrigger value="image" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <Image className="w-3 h-3 mr-1" /> Imágenes
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400 text-lg font-medium">No hay contenidos aún</p>
                <p className="text-gray-600 text-sm mt-1">
                  Genera tu primer copy, guión o imagen para verlos aquí
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((item: ContentItem) => (
                  <Card
                    key={item.id}
                    className={`bg-gray-900 border-gray-700 hover:border-gray-600 transition-all ${
                      item.isFavorite ? "ring-1 ring-yellow-500/40" : ""
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge className={`text-xs border ${typeColor(item.type)}`}>
                          <span className="flex items-center gap-1">
                            {typeIcon(item.type)}
                            {typeLabel(item.type)}
                          </span>
                        </Badge>
                        <div className="flex items-center gap-1">
                          {item.isFavorite && (
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          )}
                          <span className="text-xs text-gray-600">
                            {new Date(item.createdAt).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {item.type === "image" ? (
                        <div className="space-y-2">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt="Creativo generado"
                              className="w-full h-40 object-cover rounded-lg"
                            />
                          )}
                          <p className="text-xs text-gray-500 line-clamp-2">{item.imagePrompt}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-300 line-clamp-5 leading-relaxed">
                          {item.content}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2 ${
                            item.isFavorite
                              ? "text-yellow-400 hover:text-yellow-300"
                              : "text-gray-500 hover:text-yellow-400"
                          }`}
                          onClick={() => toggleFavorite.mutate({ id: item.id, isFavorite: !item.isFavorite })}
                        >
                          <Heart
                            className={`w-3 h-3 ${item.isFavorite ? "fill-yellow-400" : ""}`}
                          />
                        </Button>
                        {item.type !== "image" && item.content && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-gray-500 hover:text-white"
                              onClick={() => copyToClipboard(item.content!)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-gray-500 hover:text-white"
                              onClick={() =>
                                downloadContent(
                                  item.content!,
                                  `${item.type}-${item.id}.txt`
                                )
                              }
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {item.type === "image" && item.imageUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-gray-500 hover:text-white"
                            onClick={() => window.open(item.imageUrl!, "_blank")}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        )}
                        {item.adFormat && (
                          <Badge variant="outline" className="ml-auto text-xs text-gray-600 border-gray-700">
                            {item.adFormat}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
