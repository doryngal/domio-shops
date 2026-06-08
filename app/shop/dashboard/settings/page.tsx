"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Upload, Copy, Check, ExternalLink, X } from "lucide-react";

interface ShopSettings {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  whatsapp_number: string;
  instagram_url: string | null;
  custom_domain: string | null;
  theme: { accent: string; button_color: string; font: string };
  whatsapp_template: string | null;
}

const RESERVED_SLUGS = [
  "dashboard", "orders", "analytics", "settings", "products",
  "login", "logout", "api", "admin", "founder", "shop", "storefront",
];

const FONTS = [
  { value: "onest", label: "Onest" },
  { value: "inter", label: "Inter" },
  { value: "geist", label: "Geist" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [copied, setCopied] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/shop/settings")
      .then((r) => r.json())
      .then((d) => { setSettings(d); setLoading(false); });
  }, []);

  const shopUrl = settings
    ? `${window.location.origin}/storefront/${settings.slug}`
    : "";

  const copyUrl = async () => {
    if (!shopUrl) return;
    await navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    setLogoError("");
    setLogoUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/shop/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      setSettings({ ...settings, logo_url: url });
    } else {
      const { error } = await res.json().catch(() => ({ error: "Ошибка загрузки" }));
      setLogoError(error || "Ошибка загрузки");
    }
    setLogoUploading(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaveError("");
    setSaving(true);

    const res = await fetch("/api/shop/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const data = await res.json().catch(() => ({}));
      setSaveError(data.error || "Ошибка сохранения");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#C9A84C] border-t-transparent" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-[#f5f0e8]">Настройки</h2>
        <p className="text-[#888880] text-sm mt-1">Настройки вашего магазина</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* URL магазина */}
        <Card>
          <h3 className="text-[#f5f0e8] font-semibold mb-4">Ссылка на магазин</h3>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm">
            <span className="text-[#888880] truncate flex-1">{shopUrl}</span>
            <button
              type="button"
              onClick={copyUrl}
              className="flex items-center gap-1.5 text-xs text-[#888880] hover:text-[#C9A84C] transition-colors cursor-pointer flex-shrink-0 px-2 py-1 rounded-lg hover:bg-[#C9A84C]/10"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? "Скопировано" : "Скопировать"}
            </button>
            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#888880] hover:text-[#C9A84C] transition-colors cursor-pointer flex-shrink-0 p-1 rounded-lg hover:bg-[#C9A84C]/10"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </Card>

        {/* Основная информация */}
        <Card>
          <h3 className="text-[#f5f0e8] font-semibold mb-4">Информация о магазине</h3>
          <div className="space-y-4">
            {/* Slug — readonly */}
            <div>
              <label className="text-sm text-[#888880] block mb-1.5">URL-адрес (slug)</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-[#111] border border-[#2a2a2a] rounded-xl text-sm opacity-60">
                <span className="text-[#888880]">storefront/</span>
                <span className="text-[#f5f0e8]">{settings.slug}</span>
              </div>
              <p className="text-xs text-[#888880] mt-1">Slug нельзя изменить</p>
            </div>

            <Input
              label="Название магазина *"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              placeholder="Мой магазин"
            />
            <Textarea
              label="Описание"
              value={settings.description || ""}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              rows={3}
              placeholder="Краткое описание магазина"
            />

            {/* Logo upload */}
            <div>
              <label className="text-sm text-[#888880] block mb-1.5">Логотип</label>
              <div className="flex items-start gap-3">
                {settings.logo_url ? (
                  <div className="relative group flex-shrink-0">
                    <img
                      src={settings.logo_url}
                      alt="Логотип"
                      className="w-16 h-16 rounded-xl object-cover border border-[#2a2a2a]"
                    />
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, logo_url: null })}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[#1a1a1a] border border-dashed border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                    <span className="text-[#888880] text-xs text-center leading-tight px-1">Нет лого</span>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#888880] border border-[#2a2a2a] rounded-xl hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {logoUploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#C9A84C] border-t-transparent" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {logoUploading ? "Загружаю..." : "Загрузить логотип"}
                  </button>
                  <p className="text-xs text-[#888880] mt-1.5">PNG, JPG, WebP · до 10 МБ</p>
                  {logoError && <p className="text-red-400 text-xs mt-1">{logoError}</p>}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Контакты */}
        <Card>
          <h3 className="text-[#f5f0e8] font-semibold mb-4">Контакты</h3>
          <div className="space-y-4">
            <Input
              label="Номер WhatsApp *"
              value={settings.whatsapp_number}
              onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
              placeholder="+77771234567"
            />
            <Input
              label="Instagram"
              value={settings.instagram_url || ""}
              onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
              placeholder="https://instagram.com/yourshop"
            />
          </div>
        </Card>

        {/* Дизайн */}
        <Card>
          <h3 className="text-[#f5f0e8] font-semibold mb-4">Дизайн</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#888880] block mb-2">Акцентный цвет</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.theme.accent}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      theme: { ...settings.theme, accent: e.target.value, button_color: e.target.value },
                    })
                  }
                  className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-[#2a2a2a]"
                />
                <span className="text-sm text-[#888880] font-mono">{settings.theme.accent}</span>
                <div
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#0d0d0d]"
                  style={{ background: settings.theme.accent }}
                >
                  Кнопка
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm text-[#888880] block mb-2">Шрифт</label>
              <div className="flex gap-2">
                {FONTS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setSettings({ ...settings, theme: { ...settings.theme, font: f.value } })}
                    className={`px-4 py-2 rounded-xl text-sm border transition-colors cursor-pointer ${
                      settings.theme.font === f.value
                        ? "border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10"
                        : "border-[#2a2a2a] text-[#888880] hover:border-[#C9A84C]/40"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Домен */}
        <Card>
          <h3 className="text-[#f5f0e8] font-semibold mb-4">Свой домен</h3>
          <Input
            label="Домен (необязательно)"
            value={settings.custom_domain || ""}
            onChange={(e) => setSettings({ ...settings, custom_domain: e.target.value })}
            placeholder="myshop.kz"
          />
          <p className="text-xs text-[#888880] mt-2">
            Настройте CNAME запись для вашего домена на <code className="text-[#C9A84C]">cname.domio.top</code>
          </p>
        </Card>

        {/* WhatsApp шаблон */}
        <Card>
          <h3 className="text-[#f5f0e8] font-semibold mb-4">Шаблон WhatsApp</h3>
          <Textarea
            label="Шаблон сообщения"
            value={settings.whatsapp_template || ""}
            onChange={(e) => setSettings({ ...settings, whatsapp_template: e.target.value })}
            placeholder={"Привет! Хочу заказать:\n{{items}}\nИтого: {{total}} ₸"}
            rows={4}
          />
          <p className="text-xs text-[#888880] mt-2">
            Используйте {`{{items}}`} и {`{{total}}`} как плейсхолдеры
          </p>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" variant="gold" size="lg" loading={saving}>
            Сохранить изменения
          </Button>
          {saved && <span className="text-green-400 text-sm">Сохранено!</span>}
          {saveError && <span className="text-red-400 text-sm">{saveError}</span>}
        </div>
      </form>
    </div>
  );
}
