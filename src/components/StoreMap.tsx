import { useEffect, useRef } from "react";
import type { Map as LMap, LayerGroup } from "leaflet";
import type { AnomalyCase } from "@/lib/types";
import { storeLoc } from "@/lib/filters";

export default function StoreMap({ cases, selected, onSelect }: { cases: AnomalyCase[]; selected?: AnomalyCase; onSelect: (id: string) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const L = useRef<typeof import("leaflet") | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      if (cancelled || !el.current || map.current) return;
      L.current = mod;
      map.current = mod.map(el.current, { zoomControl: true }).setView([40.72, -74.0], 11);
      mod.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
      }).addTo(map.current);
      layer.current = mod.layerGroup().addTo(map.current);
      draw();
    });
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const mod = L.current;
    if (!mod || !layer.current || !map.current) return;
    layer.current.clearLayers();
    for (const c of cases) {
      const loc = storeLoc(c["Store ID"]);
      const active = selected?.["Case ID"] === c["Case ID"];
      const m = mod.marker([loc.lat, loc.lng], {
        icon: mod.divIcon({ className: "", html: `<div class="rg-pin ${active ? "rg-pin-active" : ""}"></div>`, iconSize: [18, 18] }),
        zIndexOffset: active ? 1000 : 0,
      }).addTo(layer.current);
      const div = document.createElement("div");
      const b = document.createElement("b"); b.textContent = `${loc.name} · ${c["Store ID"]}`;
      const p1 = document.createElement("div"); p1.style.fontSize = "11px"; p1.style.opacity = "0.7"; p1.textContent = `${c["Case ID"]} · ${c["Product ID"]}`;
      const p2 = document.createElement("p"); p2.textContent = `Recommended next check: ${c["Recommended Next Check"]}`;
      div.append(b, p1, p2);
      m.bindPopup(div);
      m.on("click", () => onSelect(c["Case ID"]));
      if (active) {
        map.current.flyTo([loc.lat, loc.lng], 13, { duration: 0.6 });
        m.openPopup();
      }
    }
  }

  useEffect(draw, [cases, selected]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={el} className="h-full min-h-[560px] w-full rounded-lg" />;
}
