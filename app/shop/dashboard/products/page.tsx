"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Plus, Edit2, Trash2, Image as ImageIcon, Upload, X, GripVertical, ChevronDown } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ProductOption {
  name: string;
  values: string[];
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  images: string[];
  category: string | null;
  in_stock: boolean;
  is_active: boolean;
  sort_order: number;
  options: ProductOption[];
}

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  in_stock: true,
  is_active: true,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // images
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // options/variants
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [newOptionName, setNewOptionName] = useState("");
  const [optionInputs, setOptionInputs] = useState<Record<number, string>>({});

  // drag state for image reorder
  const dragIdx = useRef<number | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/shop/products");
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openAdd = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setImages([]);
    setOptions([]);
    setOptionInputs({});
    setNewOptionName("");
    setUploadError("");
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      description: p.description || "",
      price: p.price,
      category: p.category || "",
      in_stock: p.in_stock,
      is_active: p.is_active,
    });
    setImages([...p.images]);
    setOptions(p.options ? p.options.map((o) => ({ ...o, values: [...o.values] })) : []);
    setOptionInputs({});
    setNewOptionName("");
    setUploadError("");
    setModalOpen(true);
  };

  const addOption = () => {
    const name = newOptionName.trim();
    if (!name || options.find((o) => o.name === name)) return;
    setOptions((prev) => [...prev, { name, values: [] }]);
    setNewOptionName("");
  };

  const removeOption = (idx: number) => setOptions((prev) => prev.filter((_, i) => i !== idx));

  const addOptionValue = (optIdx: number, val: string) => {
    const v = val.trim();
    if (!v) return;
    setOptions((prev) => prev.map((o, i) =>
      i === optIdx && !o.values.includes(v) ? { ...o, values: [...o.values, v] } : o
    ));
  };

  const removeOptionValue = (optIdx: number, valIdx: number) => {
    setOptions((prev) => prev.map((o, i) =>
      i === optIdx ? { ...o, values: o.values.filter((_, vi) => vi !== valIdx) } : o
    ));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (images.length + files.length > 5) {
      setUploadError("Максимум 5 изображений");
      return;
    }
    setUploadError("");
    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/shop/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setImages((prev) => [...prev, url]);
      } else {
        const { error } = await res.json().catch(() => ({ error: "Ошибка загрузки" }));
        setUploadError(error || "Ошибка загрузки");
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  // drag-and-drop reorder
  const onDragStart = (idx: number) => { dragIdx.current = idx; };
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === idx) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx.current!, 1);
      next.splice(idx, 0, moved);
      dragIdx.current = idx;
      return next;
    });
  };
  const onDragEnd = () => { dragIdx.current = null; };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);

    // flush any pending option inputs before saving
    const flushedOptions = options.map((opt, i) => {
      const pending = (optionInputs[i] || "").trim();
      if (!pending) return opt;
      const newVals = pending.split(",").map((s) => s.trim()).filter((v) => v && !opt.values.includes(v));
      return newVals.length ? { ...opt, values: [...opt.values, ...newVals] } : opt;
    });

    const body = { ...form, images, options: flushedOptions, price: parseFloat(form.price) };
    let res;
    if (editProduct) {
      res = await fetch(`/api/shop/products/${editProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      res = await fetch("/api/shop/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    setSaving(false);
    if (res?.ok) { setModalOpen(false); fetchProducts(); }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/shop/products/${id}`, { method: "DELETE" });
    if (res.ok) { setDeleteId(null); fetchProducts(); }
  };

  const toggleActive = async (p: Product) => {
    await fetch(`/api/shop/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#f5f0e8]">Каталог</h2>
          <p className="text-[#888880] text-sm mt-1">{products.length} товаров</p>
        </div>
        <Button variant="gold" onClick={openAdd}>
          <Plus size={16} className="mr-1" /> Добавить товар
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#C9A84C] border-t-transparent" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-[#888880]">
          <PackageIcon className="mx-auto mb-4 opacity-40" size={48} />
          <p>Товаров пока нет</p>
          <Button variant="outline" onClick={openAdd} className="mt-4">Добавить первый товар</Button>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-2">
            {products.map((p) => (
              <div key={p.id} className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-3 flex gap-3 items-center transition-colors hover:border-[#3a3a3a]">
                {p.images[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                    <ImageIcon size={20} className="text-[#555550]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[#f5f0e8] font-semibold text-sm truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[#C9A84C] font-bold text-sm tabular-nums">{formatPrice(p.price)} ₸</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${p.in_stock ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                      {p.in_stock ? "Есть" : "Нет"}
                    </span>
                  </div>
                  {p.category && <p className="text-[#555550] text-xs mt-0.5 truncate">{p.category}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(p)}
                    className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${p.is_active ? "bg-[#C9A84C]" : "bg-[#2a2a2a]"}`}
                    aria-label={p.is_active ? "Деактивировать" : "Активировать"}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${p.is_active ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    className="w-9 h-9 flex items-center justify-center text-[#888880] hover:text-[#f5f0e8] hover:bg-[#2a2a2a] rounded-xl transition-colors cursor-pointer"
                    aria-label="Редактировать"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteId(p.id)}
                    className="w-9 h-9 flex items-center justify-center text-[#888880] hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                    aria-label="Удалить"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left px-4 py-3 text-[#888880] font-medium w-12">Фото</th>
                  <th className="text-left px-4 py-3 text-[#888880] font-medium">Название</th>
                  <th className="text-left px-4 py-3 text-[#888880] font-medium">Категория</th>
                  <th className="text-right px-4 py-3 text-[#888880] font-medium">Цена</th>
                  <th className="text-center px-4 py-3 text-[#888880] font-medium w-20">Склад</th>
                  <th className="text-center px-4 py-3 text-[#888880] font-medium w-20">Активен</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-4 py-3">
                      {p.images[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
                          <ImageIcon size={16} className="text-[#888880]" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#f5f0e8] font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-[#888880]">{p.category || "—"}</td>
                    <td className="px-4 py-3 text-right text-[#C9A84C] font-semibold whitespace-nowrap">{formatPrice(p.price)} ₸</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.in_stock ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                        {p.in_stock ? "Есть" : "Нет"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <button
                          onClick={() => toggleActive(p)}
                          className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${p.is_active ? "bg-[#C9A84C]" : "bg-[#2a2a2a]"}`}
                          aria-label={p.is_active ? "Деактивировать" : "Активировать"}
                        >
                          <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${p.is_active ? "translate-x-4" : "translate-x-0"}`} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-[#888880] hover:text-[#f5f0e8] hover:bg-[#2a2a2a] rounded-lg transition-colors cursor-pointer"
                          aria-label="Редактировать"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="p-1.5 text-[#888880] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          aria-label="Удалить"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProduct ? "Редактировать товар" : "Новый товар"}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <Input
            label="Название *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Название товара"
          />
          <Textarea
            label="Описание"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Описание товара"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Цена (₸) *"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="0"
              min="0"
            />
            <Input
              label="Категория"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Одежда, Обувь..."
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-[#888880] mb-2">
              Изображения (до 5) · перетащи для изменения порядка
            </label>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {images.map((url, idx) => (
                  <div
                    key={url + idx}
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDragEnd={onDragEnd}
                    className="relative group w-20 h-20 cursor-grab active:cursor-grabbing"
                  >
                    <img src={url} alt="" className="w-20 h-20 rounded-xl object-cover border border-[#2a2a2a]" />
                    {/* grip indicator */}
                    <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-80 transition-opacity">
                      <GripVertical size={12} className="text-white drop-shadow" />
                    </div>
                    {/* first badge */}
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 text-[9px] bg-[#C9A84C] text-[#0d0d0d] px-1 rounded font-semibold">
                        Главная
                      </span>
                    )}
                    <button
                      onClick={() => removeImage(idx)}
                      type="button"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < 5 && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex flex-col items-center justify-center gap-2 py-6 border border-dashed border-[#2a2a2a] rounded-xl text-[#888880] hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#C9A84C] border-t-transparent" />
                  ) : (
                    <Upload size={20} />
                  )}
                  <span className="text-sm">{uploading ? "Загружаю..." : "Нажми или выбери файл"}</span>
                  <span className="text-xs opacity-60">JPEG, PNG, WebP, GIF · до 10 МБ</span>
                </button>
              </div>
            )}

            {uploadError && <p className="text-red-400 text-xs mt-1">{uploadError}</p>}
          </div>

          {/* Variants / Options */}
          <div>
            <label className="block text-sm font-medium text-[#888880] mb-2">
              Вариации (размер, цвет и т.д.)
            </label>

            {options.map((opt, optIdx) => (
              <OptionEditor
                key={opt.name}
                option={opt}
                inputValue={optionInputs[optIdx] || ""}
                onInputChange={(v) => setOptionInputs((prev) => ({ ...prev, [optIdx]: v }))}
                onRemove={() => removeOption(optIdx)}
                onAddValue={(val) => addOptionValue(optIdx, val)}
                onRemoveValue={(vi) => removeOptionValue(optIdx, vi)}
                accentColor="#C9A84C"
              />
            ))}

            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
                placeholder="Название (Размер, Цвет...)"
                className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-[#f5f0e8] placeholder:text-[#555] focus:outline-none focus:border-[#3a3a3a]"
              />
              <button
                type="button"
                onClick={addOption}
                className="px-3 py-2 bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] rounded-xl text-sm hover:bg-[#C9A84C]/20 transition-colors cursor-pointer"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.in_stock}
                onChange={(e) => setForm({ ...form, in_stock: e.target.checked })}
                className="w-4 h-4 rounded accent-[#C9A84C]"
              />
              <span className="text-sm text-[#f5f0e8]">В наличии</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded accent-[#C9A84C]"
              />
              <span className="text-sm text-[#f5f0e8]">Активен</span>
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button variant="gold" onClick={handleSave} loading={saving}>
              {editProduct ? "Сохранить" : "Добавить"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Удалить товар?">
        <p className="text-[#888880] mb-6">Это действие нельзя отменить.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Отмена</Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Удалить</Button>
        </div>
      </Modal>
    </div>
  );
}

function OptionEditor({
  option,
  inputValue,
  onInputChange,
  onRemove,
  onAddValue,
  onRemoveValue,
  accentColor,
}: {
  option: ProductOption;
  inputValue: string;
  onInputChange: (v: string) => void;
  onRemove: () => void;
  onAddValue: (val: string) => void;
  onRemoveValue: (idx: number) => void;
  accentColor: string;
}) {
  const commit = () => {
    const parts = inputValue.split(",").map((s) => s.trim()).filter(Boolean);
    parts.forEach((v) => onAddValue(v));
    onInputChange("");
  };

  return (
    <div className="mb-3 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#f5f0e8]">{option.name}</span>
        <button type="button" onClick={onRemove} className="p-1 text-[#888880] hover:text-red-400 transition-colors cursor-pointer">
          <X size={14} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {option.values.map((val, vi) => (
          <span key={vi} className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border" style={{ borderColor: accentColor + "40", color: accentColor, background: accentColor + "15" }}>
            {val}
            <button type="button" onClick={() => onRemoveValue(vi)} className="hover:text-red-400 transition-colors cursor-pointer">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), commit())}
          placeholder="S, M, L или через запятую"
          className="flex-1 px-2.5 py-1.5 bg-[#141414] border border-[#2a2a2a] rounded-lg text-xs text-[#f5f0e8] placeholder:text-[#555] focus:outline-none"
        />
        <button type="button" onClick={commit} className="px-2.5 py-1.5 bg-[#2a2a2a] rounded-lg text-xs text-[#888880] hover:text-[#f5f0e8] transition-colors cursor-pointer">
          +
        </button>
      </div>
    </div>
  );
}

function PackageIcon({ className, size }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
