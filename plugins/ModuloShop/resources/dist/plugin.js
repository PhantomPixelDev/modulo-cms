import { jsxs as a, jsx as e, Fragment as ye } from "react/jsx-runtime";
import { useAcl as Ie, useAdminToast as de, Button as y, EmptyState as Le, TableContainer as Se, Table as ie, TableHeader as ne, TableRow as z, TableHead as S, TableBody as le, TableCell as C, Badge as Q, Dialog as we, DialogContent as Fe, DialogHeader as Pe, DialogTitle as $e, DialogDescription as De, Label as c, Input as v, Select as R, SelectTrigger as I, SelectValue as L, SelectContent as E, SelectItem as $, Switch as J, DialogFooter as Ae, SectionWrapper as X, Card as U, CardHeader as V, CardTitle as H, CardDescription as G, CardFooter as ce, CardContent as K, Textarea as ue, Checkbox as Te, MediaPickerDialog as Ee, Tabs as Be, TabsList as He, TabsTrigger as se, TabsContent as re } from "@modulo/ui";
import { router as F, Head as ee, Link as Ye, usePage as We } from "@inertiajs/react";
import { forwardRef as Oe, createElement as ge, useState as w, useMemo as ve, useEffect as Ke } from "react";
function te() {
  const { isAdmin: t, hasPermission: s } = Ie();
  return (d) => t() || s(d);
}
const qe = (t) => t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), Ge = (t) => t.replace(
  /^([A-Z])|[\s-_]+(\w)/g,
  (s, d, o) => o ? o.toUpperCase() : d.toLowerCase()
), xe = (t) => {
  const s = Ge(t);
  return s.charAt(0).toUpperCase() + s.slice(1);
}, Me = (...t) => t.filter((s, d, o) => !!s && s.trim() !== "" && o.indexOf(s) === d).join(" ").trim(), Je = (t) => {
  for (const s in t)
    if (s.startsWith("aria-") || s === "role" || s === "title")
      return !0;
};
var Ze = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
const Qe = Oe(
  ({
    color: t = "currentColor",
    size: s = 24,
    strokeWidth: d = 2,
    absoluteStrokeWidth: o,
    className: N = "",
    children: _,
    iconNode: f,
    ...g
  }, h) => ge(
    "svg",
    {
      ref: h,
      ...Ze,
      width: s,
      height: s,
      stroke: t,
      strokeWidth: o ? Number(d) * 24 / Number(s) : d,
      className: Me("lucide", N),
      ...!_ && !Je(g) && { "aria-hidden": "true" },
      ...g
    },
    [
      ...f.map(([m, i]) => ge(m, i)),
      ...Array.isArray(_) ? _ : [_]
    ]
  )
);
const j = (t, s) => {
  const d = Oe(
    ({ className: o, ...N }, _) => ge(Qe, {
      ref: _,
      iconNode: s,
      className: Me(
        `lucide-${qe(xe(t))}`,
        `lucide-${t}`,
        o
      ),
      ...N
    })
  );
  return d.displayName = xe(t), d;
};
const Xe = [["path", { d: "m15 18-6-6 6-6", key: "1wnfg3" }]], et = j("chevron-left", Xe);
const tt = [["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]], at = j("chevron-right", tt);
const st = [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
], rt = j("copy", st);
const it = [
  ["rect", { width: "20", height: "14", x: "2", y: "5", rx: "2", key: "ynyp8z" }],
  ["line", { x1: "2", x2: "22", y1: "10", y2: "10", key: "1b3vmo" }]
], nt = j("credit-card", it);
const lt = [
  [
    "path",
    {
      d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
      key: "1nclc0"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
], ct = j("eye", lt);
const dt = [
  ["path", { d: "M16 5h6", key: "1vod17" }],
  ["path", { d: "M19 2v6", key: "4bpg5p" }],
  ["path", { d: "M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5", key: "1ue2ih" }],
  ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21", key: "1xmnt7" }],
  ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }]
], ot = j("image-plus", dt);
const ht = [
  [
    "path",
    {
      d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",
      key: "1a0edw"
    }
  ],
  ["path", { d: "M12 22V12", key: "d0xqtd" }],
  ["polyline", { points: "3.29 7 12 12 20.71 7", key: "ousv84" }],
  ["path", { d: "m7.5 4.27 9 5.15", key: "1c824w" }]
], je = j("package", ht);
const ut = [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
], me = j("plus", ut);
const mt = [
  [
    "path",
    {
      d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
      key: "1c8476"
    }
  ],
  ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", key: "1ydtos" }],
  ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7", key: "t51u73" }]
], pt = j("save", mt);
const gt = [
  ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }]
], vt = j("search", gt);
const yt = [
  [
    "path",
    {
      d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
      key: "1i5ecw"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
], _t = j("settings", yt);
const ft = [
  ["path", { d: "M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5", key: "slp6dd" }],
  [
    "path",
    {
      d: "M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244",
      key: "o0xfot"
    }
  ],
  ["path", { d: "M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05", key: "wn3emo" }]
], xt = j("store", ft);
const Nt = [
  ["path", { d: "M10 11v6", key: "nco0om" }],
  ["path", { d: "M14 11v6", key: "outv1u" }],
  ["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "miytrc" }],
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "e791ji" }]
], Ue = j("trash-2", Nt);
const bt = [
  ["path", { d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2", key: "wrbu53" }],
  ["path", { d: "M15 18H9", key: "1lyqi6" }],
  [
    "path",
    {
      d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",
      key: "lysw3i"
    }
  ],
  ["circle", { cx: "17", cy: "18", r: "2", key: "332jqn" }],
  ["circle", { cx: "7", cy: "18", r: "2", key: "19iecd" }]
], kt = j("truck", bt);
const Ct = [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
], Ne = j("x", Ct), D = {
  shop: {
    products: {
      index: () => route("dashboard.admin.shop.products.index"),
      store: () => route("dashboard.admin.shop.products.store"),
      update: (t) => route("dashboard.admin.shop.products.update", { post: t }),
      destroy: (t) => route("dashboard.admin.shop.products.destroy", { post: t })
    },
    orders: {
      index: () => route("dashboard.admin.shop.orders.index"),
      show: (t) => route("dashboard.admin.shop.orders.show", { order: t }),
      update: (t) => route("dashboard.admin.shop.orders.update", { order: t }),
      destroy: (t) => route("dashboard.admin.shop.orders.destroy", { order: t }),
      refund: (t) => route("dashboard.admin.shop.orders.refund", { order: t }),
      notes: (t) => route("dashboard.admin.shop.orders.notes.store", { order: t })
    },
    payments: {
      index: () => route("dashboard.admin.shop.payments.index"),
      update: (t) => route("dashboard.admin.shop.payments.update", { gateway: t })
    },
    coupons: {
      index: () => route("dashboard.admin.shop.coupons.index"),
      store: () => route("dashboard.admin.shop.coupons.store"),
      update: (t) => route("dashboard.admin.shop.coupons.update", { coupon: t }),
      destroy: (t) => route("dashboard.admin.shop.coupons.destroy", { coupon: t })
    },
    settings: {
      index: () => route("dashboard.admin.shop.settings.index")
    }
  }
}, be = {
  code: "",
  description: "",
  type: "percent",
  amount: "10",
  min_subtotal: "",
  starts_at: "",
  expires_at: "",
  usage_limit: "",
  is_active: !0
}, he = (t) => t ? t.slice(0, 10) : "";
function St(t) {
  return t.type === "percent" ? `${t.amount}% off` : t.type === "fixed" ? `${t.amount.toFixed(2)} off` : "Free shipping";
}
function wt({ coupons: t, canManage: s }) {
  const { success: d, error: o } = de(), [N, _] = w(!1), [f, g] = w(null), [h, m] = w(be), [i, p] = w({}), [x, O] = w(!1), n = t?.data ?? [], A = () => {
    g(null), m(be), p({}), _(!0);
  }, b = (r) => {
    g(r), m({
      code: r.code,
      description: r.description ?? "",
      type: r.type,
      amount: String(r.amount ?? ""),
      min_subtotal: r.min_subtotal === null ? "" : String(r.min_subtotal),
      starts_at: he(r.starts_at),
      expires_at: he(r.expires_at),
      usage_limit: r.usage_limit === null ? "" : String(r.usage_limit),
      is_active: r.is_active
    }), p({}), _(!0);
  }, P = () => {
    O(!0);
    const r = {
      code: h.code,
      description: h.description || null,
      type: h.type,
      amount: h.type === "free_shipping" ? 0 : Number(h.amount),
      min_subtotal: h.min_subtotal === "" ? null : Number(h.min_subtotal),
      starts_at: h.starts_at || null,
      expires_at: h.expires_at || null,
      usage_limit: h.usage_limit === "" ? null : Number(h.usage_limit),
      is_active: h.is_active
    }, Z = {
      preserveScroll: !0,
      onSuccess: () => {
        d(f ? "Coupon updated" : "Coupon created"), _(!1);
      },
      onError: (q) => {
        p(q), o("Please check the coupon details");
      },
      onFinish: () => O(!1)
    };
    f ? F.put(D.shop.coupons.update(f.id), r, Z) : F.post(D.shop.coupons.store(), r, Z);
  }, M = (r) => {
    confirm(`Delete coupon ${r.code}? Orders that used it keep the code.`) && F.delete(D.shop.coupons.destroy(r.id), {
      preserveScroll: !0,
      onSuccess: () => d("Coupon deleted"),
      onError: () => o("Could not delete the coupon")
    });
  }, Y = (r) => i[r] ? /* @__PURE__ */ e("p", { className: "text-xs text-destructive", children: i[r] }) : null;
  return /* @__PURE__ */ a("div", { className: "space-y-4", children: [
    /* @__PURE__ */ e("div", { className: "flex justify-end", children: s && /* @__PURE__ */ a(y, { size: "sm", onClick: A, children: [
      /* @__PURE__ */ e(me, { className: "mr-2 h-4 w-4" }),
      "New coupon"
    ] }) }),
    n.length === 0 ? /* @__PURE__ */ e(Le, { title: "No coupons yet", description: "Create a code customers can enter in their cart for a discount or free shipping." }) : /* @__PURE__ */ e(Se, { children: /* @__PURE__ */ a(ie, { children: [
      /* @__PURE__ */ e(ne, { children: /* @__PURE__ */ a(z, { children: [
        /* @__PURE__ */ e(S, { children: "Code" }),
        /* @__PURE__ */ e(S, { children: "Discount" }),
        /* @__PURE__ */ e(S, { children: "Used" }),
        /* @__PURE__ */ e(S, { children: "Valid" }),
        /* @__PURE__ */ e(S, { children: "Status" }),
        /* @__PURE__ */ e(S, { className: "text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ e(le, { children: n.map((r) => /* @__PURE__ */ a(z, { children: [
        /* @__PURE__ */ a(C, { children: [
          /* @__PURE__ */ e("div", { className: "font-mono font-medium", children: r.code }),
          r.description && /* @__PURE__ */ e("div", { className: "text-xs text-muted-foreground", children: r.description })
        ] }),
        /* @__PURE__ */ a(C, { children: [
          St(r),
          r.min_subtotal !== null && /* @__PURE__ */ a("div", { className: "text-xs text-muted-foreground", children: [
            "min. ",
            r.min_subtotal.toFixed(2)
          ] })
        ] }),
        /* @__PURE__ */ a(C, { children: [
          r.used_count,
          r.usage_limit !== null && ` / ${r.usage_limit}`
        ] }),
        /* @__PURE__ */ a(C, { className: "text-sm text-muted-foreground", children: [
          he(r.starts_at) || "now",
          " → ",
          he(r.expires_at) || "no end"
        ] }),
        /* @__PURE__ */ e(C, { children: /* @__PURE__ */ e(Q, { variant: r.is_active ? "default" : "secondary", children: r.is_active ? "Active" : "Off" }) }),
        /* @__PURE__ */ e(C, { className: "space-x-2 text-right", children: s && /* @__PURE__ */ a(ye, { children: [
          /* @__PURE__ */ e(y, { variant: "outline", size: "sm", onClick: () => b(r), children: "Edit" }),
          /* @__PURE__ */ e(y, { variant: "ghost", size: "sm", className: "text-destructive", onClick: () => M(r), children: "Delete" })
        ] }) })
      ] }, r.id)) })
    ] }) }),
    /* @__PURE__ */ e(we, { open: N, onOpenChange: _, children: /* @__PURE__ */ a(Fe, { children: [
      /* @__PURE__ */ a(Pe, { children: [
        /* @__PURE__ */ e($e, { children: f ? `Edit ${f.code}` : "New coupon" }),
        /* @__PURE__ */ e(De, { children: "Codes are not case-sensitive for customers." })
      ] }),
      /* @__PURE__ */ a("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ a("div", { className: "space-y-1 sm:col-span-2", children: [
          /* @__PURE__ */ e(c, { htmlFor: "coupon-code", children: "Code" }),
          /* @__PURE__ */ e(
            v,
            {
              id: "coupon-code",
              value: h.code,
              onChange: (r) => m({ ...h, code: r.target.value.toUpperCase() }),
              placeholder: "SUMMER10",
              className: "font-mono"
            }
          ),
          Y("code")
        ] }),
        /* @__PURE__ */ a("div", { className: "space-y-1 sm:col-span-2", children: [
          /* @__PURE__ */ e(c, { htmlFor: "coupon-description", children: "Description (only shown to you)" }),
          /* @__PURE__ */ e(
            v,
            {
              id: "coupon-description",
              value: h.description,
              onChange: (r) => m({ ...h, description: r.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ a("div", { className: "space-y-1", children: [
          /* @__PURE__ */ e(c, { children: "Type" }),
          /* @__PURE__ */ a(R, { value: h.type, onValueChange: (r) => m({ ...h, type: r }), children: [
            /* @__PURE__ */ e(I, { children: /* @__PURE__ */ e(L, {}) }),
            /* @__PURE__ */ a(E, { children: [
              /* @__PURE__ */ e($, { value: "percent", children: "Percentage off" }),
              /* @__PURE__ */ e($, { value: "fixed", children: "Fixed amount off" }),
              /* @__PURE__ */ e($, { value: "free_shipping", children: "Free shipping" })
            ] })
          ] })
        ] }),
        h.type !== "free_shipping" && /* @__PURE__ */ a("div", { className: "space-y-1", children: [
          /* @__PURE__ */ e(c, { htmlFor: "coupon-amount", children: h.type === "percent" ? "Percent" : "Amount" }),
          /* @__PURE__ */ e(
            v,
            {
              id: "coupon-amount",
              type: "number",
              min: 0,
              step: "0.01",
              value: h.amount,
              onChange: (r) => m({ ...h, amount: r.target.value })
            }
          ),
          Y("amount")
        ] }),
        /* @__PURE__ */ a("div", { className: "space-y-1", children: [
          /* @__PURE__ */ e(c, { htmlFor: "coupon-min", children: "Minimum order" }),
          /* @__PURE__ */ e(
            v,
            {
              id: "coupon-min",
              type: "number",
              min: 0,
              step: "0.01",
              value: h.min_subtotal,
              onChange: (r) => m({ ...h, min_subtotal: r.target.value }),
              placeholder: "none"
            }
          )
        ] }),
        /* @__PURE__ */ a("div", { className: "space-y-1", children: [
          /* @__PURE__ */ e(c, { htmlFor: "coupon-limit", children: "Usage limit" }),
          /* @__PURE__ */ e(
            v,
            {
              id: "coupon-limit",
              type: "number",
              min: 1,
              value: h.usage_limit,
              onChange: (r) => m({ ...h, usage_limit: r.target.value }),
              placeholder: "unlimited"
            }
          )
        ] }),
        /* @__PURE__ */ a("div", { className: "space-y-1", children: [
          /* @__PURE__ */ e(c, { htmlFor: "coupon-starts", children: "Starts" }),
          /* @__PURE__ */ e(
            v,
            {
              id: "coupon-starts",
              type: "date",
              value: h.starts_at,
              onChange: (r) => m({ ...h, starts_at: r.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ a("div", { className: "space-y-1", children: [
          /* @__PURE__ */ e(c, { htmlFor: "coupon-expires", children: "Expires" }),
          /* @__PURE__ */ e(
            v,
            {
              id: "coupon-expires",
              type: "date",
              value: h.expires_at,
              onChange: (r) => m({ ...h, expires_at: r.target.value })
            }
          ),
          Y("expires_at")
        ] }),
        /* @__PURE__ */ a("div", { className: "flex items-center justify-between sm:col-span-2", children: [
          /* @__PURE__ */ e(c, { htmlFor: "coupon-active", children: "Active" }),
          /* @__PURE__ */ e(
            J,
            {
              id: "coupon-active",
              checked: h.is_active,
              onCheckedChange: (r) => m({ ...h, is_active: r })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ a(Ae, { children: [
        /* @__PURE__ */ e(y, { variant: "outline", onClick: () => _(!1), children: "Cancel" }),
        /* @__PURE__ */ e(y, { onClick: P, disabled: x || h.code.trim() === "", children: x ? "Saving…" : "Save coupon" })
      ] })
    ] }) })
  ] });
}
function Ft({ shopCoupons: t }) {
  const s = te();
  return /* @__PURE__ */ a(X, { title: "Coupons", description: "Discount codes customers can enter in their cart.", children: [
    /* @__PURE__ */ e(ee, { title: "Coupons" }),
    /* @__PURE__ */ e(wt, { coupons: t, canManage: s("manage shop settings") })
  ] });
}
function Pt({ orders: t, canView: s, canManage: d }) {
  const [o, N] = w(""), [_, f] = w("all"), g = ve(() => t?.data ?? [], [t]), h = (n, A = "USD") => `${{ USD: "$", EUR: "€", GBP: "£", JPY: "¥" }[A] || "$"}${n.toFixed(2)}`, m = (n) => n ? new Date(n).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }) : "—", i = (n) => {
    switch (n) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }, p = (n) => {
    switch (n) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }, x = (n) => {
    n.preventDefault(), F.get(window.location.pathname, { search: o, status: _ !== "all" ? _ : void 0 }, { preserveState: !0 });
  }, O = (n) => {
    f(n), F.get(window.location.pathname, { search: o, status: n !== "all" ? n : void 0 }, { preserveState: !0 });
  };
  return s ? /* @__PURE__ */ a("div", { className: "space-y-6", children: [
    /* @__PURE__ */ a("div", { className: "flex flex-col gap-4 sm:flex-row", children: [
      /* @__PURE__ */ a("form", { onSubmit: x, className: "flex flex-1 gap-2", children: [
        /* @__PURE__ */ a("div", { className: "relative flex-1", children: [
          /* @__PURE__ */ e(vt, { className: "absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ e(
            v,
            {
              placeholder: "Search by order number, email, or name...",
              value: o,
              onChange: (n) => N(n.target.value),
              className: "pl-9"
            }
          )
        ] }),
        /* @__PURE__ */ e(y, { type: "submit", variant: "secondary", children: "Search" })
      ] }),
      /* @__PURE__ */ a(R, { value: _, onValueChange: O, children: [
        /* @__PURE__ */ e(I, { className: "w-[180px]", children: /* @__PURE__ */ e(L, { placeholder: "Filter by status" }) }),
        /* @__PURE__ */ a(E, { children: [
          /* @__PURE__ */ e($, { value: "all", children: "All Statuses" }),
          /* @__PURE__ */ e($, { value: "pending", children: "Pending" }),
          /* @__PURE__ */ e($, { value: "processing", children: "Processing" }),
          /* @__PURE__ */ e($, { value: "shipped", children: "Shipped" }),
          /* @__PURE__ */ e($, { value: "completed", children: "Completed" }),
          /* @__PURE__ */ e($, { value: "cancelled", children: "Cancelled" }),
          /* @__PURE__ */ e($, { value: "refunded", children: "Refunded" })
        ] })
      ] })
    ] }),
    g.length === 0 ? /* @__PURE__ */ a("div", { className: "py-12 text-center", children: [
      /* @__PURE__ */ e(je, { className: "mx-auto mb-4 h-12 w-12 text-muted-foreground" }),
      /* @__PURE__ */ e("p", { className: "text-muted-foreground", children: "No orders found" })
    ] }) : /* @__PURE__ */ e("div", { className: "overflow-hidden rounded-lg border", children: /* @__PURE__ */ a(ie, { children: [
      /* @__PURE__ */ e(ne, { children: /* @__PURE__ */ a(z, { children: [
        /* @__PURE__ */ e(S, { children: "Order" }),
        /* @__PURE__ */ e(S, { children: "Customer" }),
        /* @__PURE__ */ e(S, { children: "Status" }),
        /* @__PURE__ */ e(S, { children: "Payment" }),
        /* @__PURE__ */ e(S, { children: "Items" }),
        /* @__PURE__ */ e(S, { className: "text-right", children: "Total" }),
        /* @__PURE__ */ e(S, { children: "Date" }),
        /* @__PURE__ */ e(S, { className: "w-[80px]" })
      ] }) }),
      /* @__PURE__ */ e(le, { children: g.map((n) => /* @__PURE__ */ a(z, { children: [
        /* @__PURE__ */ e(C, { className: "font-medium", children: n.order_number }),
        /* @__PURE__ */ e(C, { children: /* @__PURE__ */ a("div", { children: [
          /* @__PURE__ */ e("p", { className: "font-medium", children: n.customer_name }),
          /* @__PURE__ */ e("p", { className: "text-sm text-muted-foreground", children: n.customer_email })
        ] }) }),
        /* @__PURE__ */ e(C, { children: /* @__PURE__ */ e(
          "span",
          {
            className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${i(n.status)}`,
            children: n.status_label
          }
        ) }),
        /* @__PURE__ */ e(C, { children: /* @__PURE__ */ e(
          "span",
          {
            className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${p(n.payment_status)}`,
            children: n.payment_status_label
          }
        ) }),
        /* @__PURE__ */ e(C, { children: n.item_count }),
        /* @__PURE__ */ e(C, { className: "text-right font-medium", children: h(n.total, n.currency) }),
        /* @__PURE__ */ e(C, { className: "text-sm text-muted-foreground", children: m(n.created_at) }),
        /* @__PURE__ */ e(C, { children: /* @__PURE__ */ e(y, { variant: "ghost", size: "icon", onClick: () => F.visit(`/dashboard/admin/shop/orders/${n.id}`), children: /* @__PURE__ */ e(ct, { className: "h-4 w-4" }) }) })
      ] }, n.id)) })
    ] }) }),
    t && t.last_page > 1 && /* @__PURE__ */ a("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ a("p", { className: "text-sm text-muted-foreground", children: [
        "Showing ",
        (t.current_page - 1) * t.per_page + 1,
        " to ",
        Math.min(t.current_page * t.per_page, t.total),
        " ",
        "of ",
        t.total,
        " orders"
      ] }),
      /* @__PURE__ */ a("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ e(
          y,
          {
            variant: "outline",
            size: "sm",
            disabled: t.current_page <= 1,
            onClick: () => F.get(window.location.pathname, { page: t.current_page - 1 }, { preserveState: !0 }),
            children: /* @__PURE__ */ e(et, { className: "h-4 w-4" })
          }
        ),
        /* @__PURE__ */ e(
          y,
          {
            variant: "outline",
            size: "sm",
            disabled: t.current_page >= t.last_page,
            onClick: () => F.get(window.location.pathname, { page: t.current_page + 1 }, { preserveState: !0 }),
            children: /* @__PURE__ */ e(at, { className: "h-4 w-4" })
          }
        )
      ] })
    ] })
  ] }) : /* @__PURE__ */ e("div", { className: "py-12 text-center text-muted-foreground", children: "You don't have permission to view orders." });
}
function $t({ shopOrders: t }) {
  const s = te();
  return /* @__PURE__ */ a(X, { title: "Orders", description: "Track and manage customer orders.", children: [
    /* @__PURE__ */ e(ee, { title: "Orders" }),
    /* @__PURE__ */ e(Pt, { orders: t, canView: s("view shop orders"), canManage: s("manage shop orders") })
  ] });
}
const Dt = [
  ["pending", "Pending"],
  ["processing", "Processing"],
  ["shipped", "Shipped"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
  ["refunded", "Refunded"]
], At = [
  ["pending", "Pending"],
  ["paid", "Paid"],
  ["failed", "Failed"],
  ["refunded", "Refunded"]
], pe = (t) => t ? new Date(t).toLocaleString() : "";
function Tt({ order: t, canManage: s }) {
  const { success: d, error: o } = de(), [N, _] = w(t?.status ?? "pending"), [f, g] = w(t?.payment_status ?? "pending"), [h, m] = w(t?.tracking_number ?? ""), [i, p] = w(!1), [x, O] = w(""), [n, A] = w(!1), [b, P] = w(!1), M = (u, W = "USD") => {
    const T = typeof u == "number" ? u : 0;
    return `${{ USD: "$", EUR: "€", GBP: "£", JPY: "¥" }[W] ?? W + " "}${T.toFixed(2)}`;
  }, Y = (u) => u ? [
    u.address_1,
    u.address_2,
    `${u.city || ""}${u.state ? `, ${u.state}` : ""} ${u.postcode || ""}`.trim(),
    u.country
  ].filter(Boolean).join(", ") : "—";
  if (!t)
    return /* @__PURE__ */ a(U, { children: [
      /* @__PURE__ */ a(V, { children: [
        /* @__PURE__ */ e(H, { children: "Order not found" }),
        /* @__PURE__ */ e(G, { children: "The requested order could not be loaded." })
      ] }),
      /* @__PURE__ */ e(ce, { children: /* @__PURE__ */ e(y, { variant: "outline", onClick: () => F.visit(D.shop.orders.index()), children: "Back to Orders" }) })
    ] });
  const r = N !== t.status || f !== t.payment_status || h !== (t.tracking_number ?? ""), Z = () => {
    p(!0), F.put(
      D.shop.orders.update(t.id),
      { status: N, payment_status: f, tracking_number: h || null },
      {
        preserveScroll: !0,
        onError: (u) => o(Object.values(u)[0] ?? "Could not update the order"),
        onFinish: () => p(!1)
      }
    );
  }, q = () => {
    P(!0), F.post(
      D.shop.orders.notes(t.id),
      { message: x, notify_customer: n },
      {
        preserveScroll: !0,
        onSuccess: () => {
          O(""), A(!1);
        },
        onError: () => o("Could not add the note"),
        onFinish: () => P(!1)
      }
    );
  }, oe = () => {
    const u = t.refunds_online ? "The money is refunded at the payment provider." : "This only marks the order as refunded; send the money back yourself.";
    confirm(`Refund ${M(t.total, t.currency)} for order ${t.order_number}? ${u}`) && F.post(D.shop.orders.refund(t.id), {}, { preserveScroll: !0, onSuccess: () => d("Refund recorded") });
  }, ae = [
    ...t.admin_note ? [{ id: 0, type: "note", message: t.admin_note, customer_notified: !1, author: null, created_at: null }] : [],
    ...t.notes ?? []
  ];
  return /* @__PURE__ */ a("div", { className: "space-y-6", children: [
    /* @__PURE__ */ a(U, { children: [
      /* @__PURE__ */ a(V, { className: "flex flex-col gap-3 md:flex-row md:items-center md:justify-between", children: [
        /* @__PURE__ */ a("div", { children: [
          /* @__PURE__ */ a(H, { children: [
            "Order ",
            t.order_number
          ] }),
          /* @__PURE__ */ a(G, { children: [
            "Placed by ",
            t.customer_name,
            " on ",
            pe(t.created_at)
          ] })
        ] }),
        /* @__PURE__ */ a("div", { className: "flex flex-wrap items-center gap-2", children: [
          t.invoice_url && /* @__PURE__ */ e(y, { variant: "outline", size: "sm", asChild: !0, children: /* @__PURE__ */ e("a", { href: t.invoice_url, target: "_blank", rel: "noopener", children: "Invoice" }) }),
          /* @__PURE__ */ e(Q, { variant: "outline", children: t.status_label }),
          /* @__PURE__ */ e(Q, { variant: t.payment_status === "paid" ? "default" : "secondary", children: t.payment_status_label })
        ] })
      ] }),
      /* @__PURE__ */ a(K, { className: "grid gap-4 md:grid-cols-3", children: [
        /* @__PURE__ */ a("div", { className: "space-y-1", children: [
          /* @__PURE__ */ e(c, { htmlFor: "order-status", children: "Status" }),
          /* @__PURE__ */ a(R, { value: N, onValueChange: _, disabled: !s, children: [
            /* @__PURE__ */ e(I, { id: "order-status", children: /* @__PURE__ */ e(L, {}) }),
            /* @__PURE__ */ e(E, { children: Dt.map(([u, W]) => /* @__PURE__ */ e($, { value: u, children: W }, u)) })
          ] }),
          /* @__PURE__ */ e("p", { className: "text-xs text-muted-foreground", children: "Shipped, completed and cancelled email the customer." })
        ] }),
        /* @__PURE__ */ a("div", { className: "space-y-1", children: [
          /* @__PURE__ */ e(c, { htmlFor: "order-payment", children: "Payment" }),
          /* @__PURE__ */ a(R, { value: f, onValueChange: g, disabled: !s, children: [
            /* @__PURE__ */ e(I, { id: "order-payment", children: /* @__PURE__ */ e(L, {}) }),
            /* @__PURE__ */ e(E, { children: At.map(([u, W]) => /* @__PURE__ */ e($, { value: u, children: W }, u)) })
          ] }),
          /* @__PURE__ */ e("p", { className: "text-xs text-muted-foreground", children: "Online payments update this by themselves." })
        ] }),
        /* @__PURE__ */ a("div", { className: "space-y-1", children: [
          /* @__PURE__ */ e(c, { htmlFor: "order-tracking", children: "Tracking number" }),
          /* @__PURE__ */ e(v, { id: "order-tracking", value: h, onChange: (u) => m(u.target.value), disabled: !s })
        ] })
      ] }),
      s && /* @__PURE__ */ a(ce, { className: "flex flex-wrap justify-between gap-2", children: [
        /* @__PURE__ */ e("div", { children: t.can_refund && /* @__PURE__ */ a(y, { variant: "destructive", onClick: oe, children: [
          "Refund ",
          M(t.total, t.currency)
        ] }) }),
        /* @__PURE__ */ e(y, { onClick: Z, disabled: !r || i, children: i ? "Saving…" : "Save changes" })
      ] })
    ] }),
    /* @__PURE__ */ a("div", { className: "grid gap-6 lg:grid-cols-3", children: [
      /* @__PURE__ */ a(U, { className: "lg:col-span-2", children: [
        /* @__PURE__ */ e(V, { children: /* @__PURE__ */ e(H, { children: "Items" }) }),
        /* @__PURE__ */ a(K, { children: [
          /* @__PURE__ */ a(ie, { children: [
            /* @__PURE__ */ e(ne, { children: /* @__PURE__ */ a(z, { children: [
              /* @__PURE__ */ e(S, { children: "Product" }),
              /* @__PURE__ */ e(S, { children: "SKU" }),
              /* @__PURE__ */ e(S, { className: "text-right", children: "Qty" }),
              /* @__PURE__ */ e(S, { className: "text-right", children: "Price" }),
              /* @__PURE__ */ e(S, { className: "text-right", children: "Subtotal" })
            ] }) }),
            /* @__PURE__ */ e(le, { children: (t.items ?? []).map((u) => /* @__PURE__ */ a(z, { children: [
              /* @__PURE__ */ e(C, { className: "font-medium", children: u.product_name }),
              /* @__PURE__ */ e(C, { className: "text-muted-foreground", children: u.product_sku || "—" }),
              /* @__PURE__ */ e(C, { className: "text-right", children: u.quantity }),
              /* @__PURE__ */ e(C, { className: "text-right", children: M(u.price, t.currency) }),
              /* @__PURE__ */ e(C, { className: "text-right", children: M(u.subtotal, t.currency) })
            ] }, u.id)) })
          ] }),
          /* @__PURE__ */ a("dl", { className: "mt-4 ml-auto grid max-w-xs grid-cols-2 gap-x-6 gap-y-1 text-sm", children: [
            /* @__PURE__ */ e("dt", { className: "text-muted-foreground", children: "Subtotal" }),
            /* @__PURE__ */ e("dd", { className: "text-right", children: M(t.subtotal, t.currency) }),
            (t.discount ?? 0) > 0 && /* @__PURE__ */ a(ye, { children: [
              /* @__PURE__ */ a("dt", { className: "text-muted-foreground", children: [
                "Discount",
                t.coupon_code ? ` (${t.coupon_code})` : ""
              ] }),
              /* @__PURE__ */ a("dd", { className: "text-right", children: [
                "-",
                M(t.discount, t.currency)
              ] })
            ] }),
            /* @__PURE__ */ a("dt", { className: "text-muted-foreground", children: [
              "Shipping",
              t.shipping_method ? ` (${t.shipping_method})` : ""
            ] }),
            /* @__PURE__ */ e("dd", { className: "text-right", children: M(t.shipping, t.currency) }),
            /* @__PURE__ */ e("dt", { className: "text-muted-foreground", children: "Tax" }),
            /* @__PURE__ */ e("dd", { className: "text-right", children: M(t.tax, t.currency) }),
            /* @__PURE__ */ e("dt", { className: "font-medium", children: "Total" }),
            /* @__PURE__ */ e("dd", { className: "text-right font-semibold", children: M(t.total, t.currency) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ a(U, { children: [
        /* @__PURE__ */ e(V, { children: /* @__PURE__ */ e(H, { children: "Customer" }) }),
        /* @__PURE__ */ a(K, { className: "space-y-4 text-sm", children: [
          /* @__PURE__ */ a("div", { children: [
            /* @__PURE__ */ e("div", { className: "font-medium", children: t.customer_name }),
            /* @__PURE__ */ e("a", { className: "text-muted-foreground underline", href: `mailto:${t.customer_email}`, children: t.customer_email }),
            t.customer_phone && /* @__PURE__ */ e("div", { className: "text-muted-foreground", children: t.customer_phone })
          ] }),
          /* @__PURE__ */ a("div", { children: [
            /* @__PURE__ */ e("div", { className: "text-muted-foreground", children: "Billing address" }),
            /* @__PURE__ */ e("div", { children: Y(t.billing_address) })
          ] }),
          /* @__PURE__ */ a("div", { children: [
            /* @__PURE__ */ e("div", { className: "text-muted-foreground", children: "Shipping address" }),
            /* @__PURE__ */ e("div", { children: Y(t.shipping_address) })
          ] }),
          t.customer_note && /* @__PURE__ */ a("div", { children: [
            /* @__PURE__ */ e("div", { className: "text-muted-foreground", children: "Customer note" }),
            /* @__PURE__ */ e("div", { className: "whitespace-pre-line", children: t.customer_note })
          ] }),
          /* @__PURE__ */ a("div", { children: [
            /* @__PURE__ */ e("div", { className: "text-muted-foreground", children: "Payment method" }),
            /* @__PURE__ */ e("div", { children: t.payment_method ?? "—" }),
            t.transaction_id && /* @__PURE__ */ e("div", { className: "font-mono text-xs text-muted-foreground", children: t.transaction_id })
          ] })
        ] })
      ] })
    ] }),
    (t.payments?.length ?? 0) > 0 && /* @__PURE__ */ a(U, { children: [
      /* @__PURE__ */ a(V, { children: [
        /* @__PURE__ */ e(H, { children: "Payment attempts" }),
        /* @__PURE__ */ e(G, { children: "Every time the customer was sent to a payment provider." })
      ] }),
      /* @__PURE__ */ e(K, { children: /* @__PURE__ */ a(ie, { children: [
        /* @__PURE__ */ e(ne, { children: /* @__PURE__ */ a(z, { children: [
          /* @__PURE__ */ e(S, { children: "When" }),
          /* @__PURE__ */ e(S, { children: "Provider" }),
          /* @__PURE__ */ e(S, { children: "Reference" }),
          /* @__PURE__ */ e(S, { children: "Status" }),
          /* @__PURE__ */ e(S, { className: "text-right", children: "Amount" })
        ] }) }),
        /* @__PURE__ */ e(le, { children: t.payments.map((u) => /* @__PURE__ */ a(z, { children: [
          /* @__PURE__ */ e(C, { children: pe(u.created_at) }),
          /* @__PURE__ */ e(C, { children: u.gateway }),
          /* @__PURE__ */ e(C, { className: "font-mono text-xs", children: u.provider_ref }),
          /* @__PURE__ */ e(C, { children: /* @__PURE__ */ e(Q, { variant: u.status === "paid" ? "default" : "secondary", children: u.status }) }),
          /* @__PURE__ */ e(C, { className: "text-right", children: M(u.amount, u.currency) })
        ] }, u.id)) })
      ] }) })
    ] }),
    /* @__PURE__ */ a(U, { children: [
      /* @__PURE__ */ a(V, { children: [
        /* @__PURE__ */ e(H, { children: "History" }),
        /* @__PURE__ */ e(G, { children: "Notes from staff, status changes and payment events." })
      ] }),
      /* @__PURE__ */ a(K, { className: "space-y-4", children: [
        ae.length === 0 && /* @__PURE__ */ e("p", { className: "text-sm text-muted-foreground", children: "Nothing yet." }),
        /* @__PURE__ */ e("ol", { className: "space-y-3", children: ae.map((u) => /* @__PURE__ */ a("li", { className: `rounded-md border p-3 text-sm ${u.type === "note" ? "bg-muted/40" : ""}`, children: [
          /* @__PURE__ */ e("div", { className: "whitespace-pre-line", children: u.message }),
          /* @__PURE__ */ a("div", { className: "mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground", children: [
            u.created_at && /* @__PURE__ */ e("span", { children: pe(u.created_at) }),
            u.author && /* @__PURE__ */ a("span", { children: [
              "by ",
              u.author
            ] }),
            u.type !== "note" && /* @__PURE__ */ a("span", { children: [
              "· ",
              u.type
            ] }),
            u.customer_notified && /* @__PURE__ */ e("span", { children: "· emailed to customer" })
          ] })
        ] }, `${u.id}-${u.created_at}`)) }),
        s && /* @__PURE__ */ a("div", { className: "space-y-2 border-t pt-4", children: [
          /* @__PURE__ */ e(c, { htmlFor: "order-note", children: "Add a note" }),
          /* @__PURE__ */ e(ue, { id: "order-note", rows: 3, value: x, onChange: (u) => O(u.target.value) }),
          /* @__PURE__ */ a("div", { className: "flex items-center justify-between gap-4", children: [
            /* @__PURE__ */ a("label", { className: "flex items-center gap-2 text-sm", children: [
              /* @__PURE__ */ e(Te, { checked: n, onCheckedChange: (u) => A(u === !0) }),
              "Email this note to the customer"
            ] }),
            /* @__PURE__ */ e(y, { onClick: q, disabled: b || x.trim() === "", children: b ? "Adding…" : "Add note" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function Ot({ shopOrder: t }) {
  const s = te();
  return /* @__PURE__ */ a(
    X,
    {
      title: t ? `Order ${t.order_number}` : "Order",
      description: "View order information and update status.",
      actions: /* @__PURE__ */ e(y, { variant: "outline", size: "sm", asChild: !0, children: /* @__PURE__ */ e(Ye, { href: D.shop.orders.index(), children: "Back to orders" }) }),
      children: [
        /* @__PURE__ */ e(ee, { title: t ? `Order ${t.order_number}` : "Order" }),
        /* @__PURE__ */ e(Tt, { order: t, canManage: s("manage shop orders") })
      ]
    }
  );
}
function Mt({ gateway: t, canManage: s }) {
  const { success: d, error: o } = de(), [N, _] = w(t.enabled), [f, g] = w(
    () => Object.fromEntries(t.fields.map((n) => [n.key, n.type === "secret" ? "" : String(t.values[n.key] ?? "")]))
  ), [h, m] = w([]), [i, p] = w(!1), x = () => {
    p(!0), F.put(
      D.shop.payments.update(t.id),
      { enabled: N, values: f, forget: h },
      {
        preserveScroll: !0,
        onSuccess: () => {
          g(
            (n) => Object.fromEntries(
              Object.entries(n).map(([A, b]) => [A, t.fields.find((P) => P.key === A)?.type === "secret" ? "" : b])
            )
          ), m([]);
        },
        onError: () => o(`Could not save ${t.label}`),
        onFinish: () => p(!1)
      }
    );
  }, O = async () => {
    if (t.webhook_url)
      try {
        await navigator.clipboard.writeText(t.webhook_url), d("Webhook URL copied");
      } catch {
        o("Copy failed; select the URL and copy it by hand");
      }
  };
  return /* @__PURE__ */ a(U, { children: [
    /* @__PURE__ */ a(V, { className: "flex flex-row items-start justify-between gap-4 space-y-0", children: [
      /* @__PURE__ */ a("div", { className: "space-y-1", children: [
        /* @__PURE__ */ a(H, { className: "flex items-center gap-2", children: [
          t.label,
          t.online && /* @__PURE__ */ e(Q, { variant: "outline", children: "Online" })
        ] }),
        /* @__PURE__ */ a(G, { children: [
          t.enabled && t.configured && "Offered at checkout.",
          t.enabled && !t.configured && "Switched on, but not offered until its keys are filled in.",
          !t.enabled && "Not offered at checkout."
        ] })
      ] }),
      /* @__PURE__ */ e(J, { checked: N, onCheckedChange: _, disabled: !s, "aria-label": `Offer ${t.label}` })
    ] }),
    t.fields.length > 0 && /* @__PURE__ */ a(K, { className: "grid gap-4 md:grid-cols-2", children: [
      t.fields.map((n) => {
        const A = `${t.id}-${n.key}`, b = n.type === "secret" && t.values[n.key] === !0 && !h.includes(n.key);
        return /* @__PURE__ */ a("div", { className: `space-y-1 ${n.type === "textarea" ? "md:col-span-2" : ""}`, children: [
          /* @__PURE__ */ e(c, { htmlFor: A, children: n.label }),
          n.type === "textarea" ? /* @__PURE__ */ e(
            ue,
            {
              id: A,
              rows: 4,
              value: f[n.key],
              onChange: (P) => g({ ...f, [n.key]: P.target.value }),
              disabled: !s
            }
          ) : n.type === "select" ? /* @__PURE__ */ a(
            R,
            {
              value: f[n.key] || void 0,
              onValueChange: (P) => g({ ...f, [n.key]: P }),
              disabled: !s,
              children: [
                /* @__PURE__ */ e(I, { id: A, children: /* @__PURE__ */ e(L, { placeholder: "Choose…" }) }),
                /* @__PURE__ */ e(E, { children: Object.entries(n.options ?? {}).map(([P, M]) => /* @__PURE__ */ e($, { value: P, children: M }, P)) })
              ]
            }
          ) : /* @__PURE__ */ a("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ e(
              v,
              {
                id: A,
                type: n.type === "secret" ? "password" : "text",
                autoComplete: "off",
                value: f[n.key],
                placeholder: b ? "•••••••• saved (type to replace)" : "",
                onChange: (P) => g({ ...f, [n.key]: P.target.value }),
                disabled: !s
              }
            ),
            b && s && /* @__PURE__ */ e(y, { type: "button", variant: "ghost", size: "sm", onClick: () => m([...h, n.key]), children: "Remove" })
          ] }),
          n.help && /* @__PURE__ */ e("p", { className: "text-xs text-muted-foreground", children: n.help })
        ] }, n.key);
      }),
      t.webhook_url && /* @__PURE__ */ a("div", { className: "space-y-1 md:col-span-2", children: [
        /* @__PURE__ */ e(c, { htmlFor: `${t.id}-webhook`, children: "Webhook URL" }),
        /* @__PURE__ */ a("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ e(v, { id: `${t.id}-webhook`, readOnly: !0, value: t.webhook_url, className: "font-mono text-xs" }),
          /* @__PURE__ */ e(y, { type: "button", variant: "outline", size: "icon", onClick: O, "aria-label": "Copy webhook URL", children: /* @__PURE__ */ e(rt, { className: "h-4 w-4" }) })
        ] })
      ] })
    ] }),
    s && /* @__PURE__ */ e(ce, { className: "justify-end", children: /* @__PURE__ */ e(y, { onClick: x, disabled: i, children: i ? "Saving…" : `Save ${t.label}` }) })
  ] });
}
function jt({ gateways: t, canManage: s }) {
  return /* @__PURE__ */ a("div", { className: "space-y-6", children: [
    /* @__PURE__ */ a("p", { className: "text-sm text-muted-foreground", children: [
      "Keys are stored encrypted and never shown again after saving. Use test keys first (Stripe ",
      /* @__PURE__ */ e("code", { children: "sk_test_…" }),
      ", PayPal sandbox, Mollie ",
      /* @__PURE__ */ e("code", { children: "test_…" }),
      ") and place a test order before switching to live keys."
    ] }),
    t.map((d) => /* @__PURE__ */ e(Mt, { gateway: d, canManage: s }, d.id))
  ] });
}
function Ut({ shopGateways: t }) {
  const s = te();
  return /* @__PURE__ */ a(X, { title: "Payments", description: "Choose how customers can pay. Online methods send them to the provider's secure page.", children: [
    /* @__PURE__ */ e(ee, { title: "Payments" }),
    /* @__PURE__ */ e(jt, { gateways: t ?? [], canManage: s("manage shop settings") })
  ] });
}
function ke({ label: t, terms: s, selected: d, onChange: o }) {
  return s.length === 0 ? /* @__PURE__ */ a("div", { className: "space-y-1", children: [
    /* @__PURE__ */ e(c, { children: t }),
    /* @__PURE__ */ e("p", { className: "text-xs text-muted-foreground", children: "None yet. Add them under the shop taxonomies." })
  ] }) : /* @__PURE__ */ a("fieldset", { className: "space-y-2", children: [
    /* @__PURE__ */ e("legend", { className: "text-sm font-medium", children: t }),
    /* @__PURE__ */ e("div", { className: "flex flex-wrap gap-x-4 gap-y-2", children: s.map((N) => /* @__PURE__ */ a("label", { className: "flex items-center gap-2 text-sm", children: [
      /* @__PURE__ */ e(
        Te,
        {
          checked: d.includes(N.id),
          onCheckedChange: (_) => o(_ === !0 ? [...d, N.id] : d.filter((f) => f !== N.id))
        }
      ),
      N.name
    ] }, N.id)) })
  ] });
}
function Vt({
  value: t,
  onChange: s,
  categories: d,
  tags: o,
  errors: N
}) {
  const [_, f] = w(null), g = (m) => N[m] ? /* @__PURE__ */ e("p", { className: "text-xs text-destructive", children: N[m] }) : null, h = (m, i) => s({ variants: t.variants.map((p, x) => x === m ? { ...p, ...i } : p) });
  return /* @__PURE__ */ a("div", { className: "space-y-6", children: [
    /* @__PURE__ */ a("section", { className: "grid gap-4 md:grid-cols-4", children: [
      /* @__PURE__ */ a("div", { className: "space-y-1", children: [
        /* @__PURE__ */ e(c, { htmlFor: "pd-sale", children: "Sale price" }),
        /* @__PURE__ */ e(
          v,
          {
            id: "pd-sale",
            type: "number",
            min: 0,
            step: "0.01",
            value: t.sale_price,
            onChange: (m) => s({ sale_price: m.target.value })
          }
        ),
        g("sale_price")
      ] }),
      /* @__PURE__ */ a("div", { className: "space-y-1", children: [
        /* @__PURE__ */ e(c, { htmlFor: "pd-sale-from", children: "Sale from" }),
        /* @__PURE__ */ e(
          v,
          {
            id: "pd-sale-from",
            type: "date",
            value: t.sale_starts_at,
            onChange: (m) => s({ sale_starts_at: m.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ a("div", { className: "space-y-1", children: [
        /* @__PURE__ */ e(c, { htmlFor: "pd-sale-to", children: "Sale until" }),
        /* @__PURE__ */ e(v, { id: "pd-sale-to", type: "date", value: t.sale_ends_at, onChange: (m) => s({ sale_ends_at: m.target.value }) }),
        g("sale_ends_at")
      ] }),
      /* @__PURE__ */ a("div", { className: "space-y-1", children: [
        /* @__PURE__ */ e(c, { htmlFor: "pd-weight", children: "Weight (kg)" }),
        /* @__PURE__ */ e(
          v,
          {
            id: "pd-weight",
            type: "number",
            min: 0,
            step: "0.001",
            value: t.weight,
            onChange: (m) => s({ weight: m.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ e("p", { className: "text-xs text-muted-foreground md:col-span-4", children: "Leave the dates empty for a sale without a start or end." })
    ] }),
    /* @__PURE__ */ a("section", { className: "space-y-2", children: [
      /* @__PURE__ */ e(c, { children: "Images" }),
      /* @__PURE__ */ a("div", { className: "flex flex-wrap gap-3", children: [
        /* @__PURE__ */ e("div", { className: "space-y-1", children: t.featured_image ? /* @__PURE__ */ a("div", { className: "relative", children: [
          /* @__PURE__ */ e("img", { src: t.featured_image, alt: "", className: "h-24 w-24 rounded-md border object-cover" }),
          /* @__PURE__ */ e(
            "button",
            {
              type: "button",
              onClick: () => s({ featured_image: "" }),
              className: "absolute -top-2 -right-2 rounded-full bg-background p-0.5 shadow",
              "aria-label": "Remove main image",
              children: /* @__PURE__ */ e(Ne, { className: "h-4 w-4" })
            }
          )
        ] }) : /* @__PURE__ */ a(y, { type: "button", variant: "outline", className: "h-24 w-24 flex-col", onClick: () => f("featured"), children: [
          /* @__PURE__ */ e(ot, { className: "h-5 w-5" }),
          /* @__PURE__ */ e("span", { className: "text-xs", children: "Main image" })
        ] }) }),
        t.gallery.map((m, i) => /* @__PURE__ */ a("div", { className: "relative", children: [
          /* @__PURE__ */ e("img", { src: m, alt: "", className: "h-24 w-24 rounded-md border object-cover" }),
          /* @__PURE__ */ e(
            "button",
            {
              type: "button",
              onClick: () => s({ gallery: t.gallery.filter((p, x) => x !== i) }),
              className: "absolute -top-2 -right-2 rounded-full bg-background p-0.5 shadow",
              "aria-label": "Remove image",
              children: /* @__PURE__ */ e(Ne, { className: "h-4 w-4" })
            }
          )
        ] }, `${m}-${i}`)),
        /* @__PURE__ */ a(y, { type: "button", variant: "outline", className: "h-24 w-24 flex-col", onClick: () => f("gallery"), children: [
          /* @__PURE__ */ e(me, { className: "h-5 w-5" }),
          /* @__PURE__ */ e("span", { className: "text-xs", children: "Gallery" })
        ] })
      ] }),
      /* @__PURE__ */ e(
        Ee,
        {
          open: _ !== null,
          onOpenChange: (m) => !m && f(null),
          onSelect: (m) => {
            _ === "featured" && s({ featured_image: m.url }), _ === "gallery" && s({ gallery: [...t.gallery, m.url] }), f(null);
          }
        }
      )
    ] }),
    /* @__PURE__ */ a("section", { className: "grid gap-4 md:grid-cols-2", children: [
      /* @__PURE__ */ e(ke, { label: "Categories", terms: d, selected: t.categories, onChange: (m) => s({ categories: m }) }),
      /* @__PURE__ */ e(ke, { label: "Tags", terms: o, selected: t.tags, onChange: (m) => s({ tags: m }) })
    ] }),
    /* @__PURE__ */ a("section", { className: "space-y-2", children: [
      /* @__PURE__ */ a("div", { children: [
        /* @__PURE__ */ e(c, { children: "Variations" }),
        /* @__PURE__ */ e("p", { className: "text-xs text-muted-foreground", children: "Sizes, colours… Customers must pick one. Empty price uses the product price; empty stock is not tracked." })
      ] }),
      t.variants.map((m, i) => /* @__PURE__ */ a("div", { className: "grid grid-cols-[1fr_7rem_6rem_5rem_auto] items-end gap-2", children: [
        /* @__PURE__ */ a("div", { className: "space-y-1", children: [
          i === 0 && /* @__PURE__ */ e(c, { className: "text-xs", children: "Option" }),
          /* @__PURE__ */ e(
            v,
            {
              value: m.name,
              placeholder: "Red / L",
              onChange: (p) => h(i, { name: p.target.value }),
              "aria-label": "Option name"
            }
          )
        ] }),
        /* @__PURE__ */ a("div", { className: "space-y-1", children: [
          i === 0 && /* @__PURE__ */ e(c, { className: "text-xs", children: "SKU" }),
          /* @__PURE__ */ e(v, { value: m.sku, onChange: (p) => h(i, { sku: p.target.value }), "aria-label": "Option SKU" })
        ] }),
        /* @__PURE__ */ a("div", { className: "space-y-1", children: [
          i === 0 && /* @__PURE__ */ e(c, { className: "text-xs", children: "Price" }),
          /* @__PURE__ */ e(
            v,
            {
              type: "number",
              min: 0,
              step: "0.01",
              value: m.price,
              onChange: (p) => h(i, { price: p.target.value }),
              "aria-label": "Option price"
            }
          )
        ] }),
        /* @__PURE__ */ a("div", { className: "space-y-1", children: [
          i === 0 && /* @__PURE__ */ e(c, { className: "text-xs", children: "Stock" }),
          /* @__PURE__ */ e(
            v,
            {
              type: "number",
              min: 0,
              value: m.stock,
              onChange: (p) => h(i, { stock: p.target.value }),
              "aria-label": "Option stock"
            }
          )
        ] }),
        /* @__PURE__ */ e(
          y,
          {
            type: "button",
            variant: "ghost",
            size: "icon",
            onClick: () => s({ variants: t.variants.filter((p, x) => x !== i) }),
            "aria-label": `Remove ${m.name || "option"}`,
            children: /* @__PURE__ */ e(Ue, { className: "h-4 w-4" })
          }
        )
      ] }, m.id ?? `new-${i}`)),
      g("variants"),
      /* @__PURE__ */ a(
        y,
        {
          type: "button",
          variant: "outline",
          size: "sm",
          onClick: () => s({ variants: [...t.variants, { name: "", sku: "", price: "", stock: "" }] }),
          children: [
            /* @__PURE__ */ e(me, { className: "mr-2 h-4 w-4" }),
            "Add variation"
          ]
        }
      )
    ] })
  ] });
}
function Ce(t) {
  const s = (d) => d == null ? "" : String(d);
  return {
    sale_price: s(t?.sale_price),
    sale_starts_at: s(t?.sale_starts_at).slice(0, 10),
    sale_ends_at: s(t?.sale_ends_at).slice(0, 10),
    weight: s(t?.weight),
    featured_image: s(t?.featured_image),
    gallery: Array.isArray(t?.gallery) ? t.gallery.filter((d) => typeof d == "string") : [],
    categories: Array.isArray(t?.categories) ? t.categories : [],
    tags: Array.isArray(t?.tags) ? t.tags : [],
    variants: Array.isArray(t?.variants) ? t.variants.map((d) => ({
      id: typeof d.id == "string" ? d.id : void 0,
      name: s(d.name),
      sku: s(d.sku),
      price: s(d.price),
      stock: s(d.stock)
    })) : []
  };
}
function zt(t) {
  const s = (d) => d.trim() === "" ? null : Number(d);
  return {
    sale_price: s(t.sale_price),
    sale_starts_at: t.sale_starts_at || null,
    sale_ends_at: t.sale_ends_at || null,
    weight: s(t.weight),
    featured_image: t.featured_image || null,
    gallery: t.gallery,
    categories: t.categories,
    tags: t.tags,
    variants: t.variants.filter((d) => d.name.trim() !== "").map((d) => ({ id: d.id, name: d.name.trim(), sku: d.sku || null, price: s(d.price), stock: s(d.stock) }))
  };
}
function Rt({
  products: t,
  categories: s = [],
  tags: d = [],
  initialEdit: o = null,
  canView: N,
  canCreate: _,
  canEdit: f,
  canDelete: g
}) {
  const { success: h, error: m } = de(), p = We().props?.errors || {}, [x, O] = w(!1), [n, A] = w({}), [b, P] = w({
    sku: "",
    name: "",
    slug: "",
    description: "",
    price: "0",
    sale_price: "",
    currency: "USD",
    stock: "",
    status: "published",
    featured_image: ""
  }), M = ve(() => t?.data ?? [], [t]), Y = _ && b.name.trim().length > 0 && String(b.price).trim().length > 0, r = ve(() => ({ ...p, ...n }), [p, n]), [Z, q] = w(!1), [oe, ae] = w(Ce(null)), [u, W] = w(null), [T, B] = w({
    sku: "",
    name: "",
    slug: "",
    description: "",
    price: "0",
    sale_price: "",
    currency: "USD",
    stock: "",
    status: "published",
    featured_image: ""
  }), _e = (l) => {
    f && (W(l), B({
      sku: l.sku ?? "",
      name: l.name ?? "",
      slug: l.slug ?? "",
      description: l.description ?? "",
      price: String(l.price ?? "0"),
      sale_price: l.sale_price ? String(l.sale_price) : "",
      currency: l.currency ?? "USD",
      stock: l.stock === null || l.stock === void 0 ? "" : String(l.stock),
      status: l.is_active ? "published" : "draft",
      featured_image: l.featured_image ?? ""
    }), ae(Ce(l)), A({}), q(!0));
  };
  Ke(() => {
    o && _e(o);
  }, [o?.id]);
  const fe = (l) => {
    F.visit(`${D.shop.products.index()}?page=${l}`, {
      preserveScroll: !0
    });
  }, Ve = () => {
    Y && (O(!0), A({}), F.post(
      D.shop.products.store(),
      {
        sku: b.sku || null,
        name: b.name,
        slug: b.slug || null,
        description: b.description || null,
        price: Number(b.price),
        sale_price: b.sale_price === "" ? null : Number(b.sale_price),
        currency: b.currency || null,
        stock: b.stock === "" ? null : Number(b.stock),
        status: b.status,
        featured_image: b.featured_image || null
      },
      {
        preserveScroll: !0,
        onSuccess: () => {
          h("Product created"), A({}), P((l) => ({
            ...l,
            sku: "",
            name: "",
            slug: "",
            description: "",
            price: "0",
            sale_price: "",
            stock: "",
            status: "published",
            featured_image: ""
          }));
        },
        onError: (l) => {
          A(l), m("Failed to create product");
        },
        onFinish: () => O(!1)
      }
    ));
  }, ze = () => {
    !u || !f || (O(!0), A({}), F.put(
      D.shop.products.update(u.id),
      {
        sku: T.sku || null,
        name: T.name,
        slug: T.slug || null,
        description: T.description || null,
        price: Number(T.price),
        currency: T.currency || null,
        stock: T.stock === "" ? null : Number(T.stock),
        status: T.status,
        ...zt(oe)
      },
      {
        preserveScroll: !0,
        onSuccess: () => {
          h("Product updated"), q(!1), W(null);
        },
        onError: (l) => {
          A(l), m("Failed to update product");
        },
        onFinish: () => O(!1)
      }
    ));
  }, Re = (l) => {
    g && confirm(`Delete "${l.name}"? This cannot be undone.`) && F.delete(D.shop.products.destroy(l.id), {
      preserveScroll: !0,
      onSuccess: () => h("Product deleted"),
      onError: () => m("Failed to delete product")
    });
  };
  return N ? /* @__PURE__ */ a("div", { className: "space-y-6", children: [
    /* @__PURE__ */ a(U, { children: [
      /* @__PURE__ */ a(V, { className: "flex flex-col gap-3 md:flex-row md:items-center md:justify-between", children: [
        /* @__PURE__ */ a("div", { children: [
          /* @__PURE__ */ e(H, { children: "Products" }),
          /* @__PURE__ */ e(G, { children: "Manage your store catalog." })
        ] }),
        /* @__PURE__ */ a("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ e(y, { variant: "outline", size: "sm", onClick: () => F.visit(D.shop.orders.index()), children: "Orders" }),
          /* @__PURE__ */ e(y, { variant: "outline", size: "sm", onClick: () => F.visit(D.shop.coupons.index()), children: "Coupons" }),
          /* @__PURE__ */ e(y, { variant: "outline", size: "sm", onClick: () => F.visit(D.shop.payments.index()), children: "Payments" }),
          /* @__PURE__ */ e(y, { variant: "outline", size: "sm", onClick: () => F.visit(D.shop.settings.index()), children: "Shop Settings" })
        ] })
      ] }),
      /* @__PURE__ */ e(K, { children: /* @__PURE__ */ a(Se, { children: [
        /* @__PURE__ */ a(ie, { dense: !0, children: [
          /* @__PURE__ */ e(ne, { children: /* @__PURE__ */ a(z, { children: [
            /* @__PURE__ */ e(S, { children: "Name" }),
            /* @__PURE__ */ e(S, { children: "Status" }),
            /* @__PURE__ */ e(S, { className: "text-right", children: "Price" }),
            /* @__PURE__ */ e(S, { className: "text-right", children: "Stock" })
          ] }) }),
          /* @__PURE__ */ e(le, { children: M.length === 0 ? /* @__PURE__ */ e(z, { children: /* @__PURE__ */ e(C, { colSpan: 4, className: "text-muted-foreground", children: "No products yet." }) }) : M.map((l) => /* @__PURE__ */ a(z, { children: [
            /* @__PURE__ */ e(C, { className: "font-medium", children: /* @__PURE__ */ a("div", { className: "flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ e("span", { children: l.name }),
              (f || g) && /* @__PURE__ */ a("div", { className: "flex items-center gap-2", children: [
                f && /* @__PURE__ */ e(y, { variant: "outline", size: "sm", className: "h-7 px-2", onClick: () => _e(l), children: "Edit" }),
                g && /* @__PURE__ */ e(
                  y,
                  {
                    variant: "outline",
                    size: "sm",
                    className: "h-7 px-2 text-destructive hover:text-destructive",
                    onClick: () => Re(l),
                    children: "Delete"
                  }
                )
              ] })
            ] }) }),
            /* @__PURE__ */ e(C, { children: /* @__PURE__ */ e(Q, { variant: l.is_active ? "default" : "secondary", children: l.is_active ? "Published" : "Draft" }) }),
            /* @__PURE__ */ a(C, { className: "text-right", children: [
              l.currency,
              " ",
              Number(l.price).toFixed(2)
            ] }),
            /* @__PURE__ */ e(C, { className: "text-right", children: l.stock ?? "—" })
          ] }, l.id)) })
        ] }),
        t ? /* @__PURE__ */ a("div", { className: "mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ a("div", { children: [
            "Page ",
            t.current_page,
            " of ",
            t.last_page,
            " • Total ",
            t.total
          ] }),
          /* @__PURE__ */ a("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ e(
              y,
              {
                variant: "outline",
                size: "sm",
                className: "h-7",
                disabled: t.current_page <= 1,
                onClick: () => fe(t.current_page - 1),
                children: "Prev"
              }
            ),
            /* @__PURE__ */ e(
              y,
              {
                variant: "outline",
                size: "sm",
                className: "h-7",
                disabled: t.current_page >= t.last_page,
                onClick: () => fe(t.current_page + 1),
                children: "Next"
              }
            )
          ] })
        ] }) : null
      ] }) }),
      /* @__PURE__ */ a(ce, { className: "flex flex-wrap items-center justify-between gap-2", children: [
        /* @__PURE__ */ a("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ e(y, { variant: "outline", size: "sm", onClick: () => F.visit(D.shop.orders.index()), children: "Orders" }),
          /* @__PURE__ */ e(y, { variant: "outline", size: "sm", onClick: () => F.visit(D.shop.coupons.index()), children: "Coupons" }),
          /* @__PURE__ */ e(y, { variant: "outline", size: "sm", onClick: () => F.visit(D.shop.payments.index()), children: "Payments" }),
          /* @__PURE__ */ e(y, { variant: "outline", size: "sm", onClick: () => F.visit(D.shop.settings.index()), children: "Shop Settings" })
        ] }),
        /* @__PURE__ */ e(y, { variant: "outline", size: "sm", onClick: () => F.visit(D.shop.products.index()), children: "Refresh" })
      ] })
    ] }),
    /* @__PURE__ */ a(U, { children: [
      /* @__PURE__ */ a(V, { children: [
        /* @__PURE__ */ e(H, { children: "Create product" }),
        /* @__PURE__ */ e(G, { children: "Add a new product to your store." })
      ] }),
      /* @__PURE__ */ a(K, { className: "space-y-4", children: [
        /* @__PURE__ */ a("div", { className: "grid gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "name", children: "Name" }),
            /* @__PURE__ */ e(
              v,
              {
                id: "name",
                value: b.name,
                onChange: (l) => P((k) => ({ ...k, name: l.target.value })),
                disabled: !_,
                placeholder: "T-Shirt"
              }
            ),
            r?.name ? /* @__PURE__ */ e("div", { className: "text-xs text-destructive", children: r.name }) : null
          ] }),
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "sku", children: "SKU" }),
            /* @__PURE__ */ e(
              v,
              {
                id: "sku",
                value: b.sku,
                onChange: (l) => P((k) => ({ ...k, sku: l.target.value })),
                disabled: !_,
                placeholder: "TSHIRT-001"
              }
            ),
            r?.sku ? /* @__PURE__ */ e("div", { className: "text-xs text-destructive", children: r.sku }) : null
          ] })
        ] }),
        /* @__PURE__ */ a("div", { className: "grid gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "slug", children: "Slug (optional)" }),
            /* @__PURE__ */ e(
              v,
              {
                id: "slug",
                value: b.slug,
                onChange: (l) => P((k) => ({ ...k, slug: l.target.value })),
                disabled: !_,
                placeholder: "t-shirt"
              }
            ),
            r?.slug ? /* @__PURE__ */ e("div", { className: "text-xs text-destructive", children: r.slug }) : null
          ] }),
          /* @__PURE__ */ a("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ a("div", { className: "space-y-2", children: [
              /* @__PURE__ */ e(c, { htmlFor: "price", children: "Price" }),
              /* @__PURE__ */ e(
                v,
                {
                  id: "price",
                  type: "number",
                  value: b.price,
                  onChange: (l) => P((k) => ({ ...k, price: l.target.value })),
                  disabled: !_,
                  min: 0,
                  step: 0.01
                }
              ),
              r?.price ? /* @__PURE__ */ e("div", { className: "text-xs text-destructive", children: r.price }) : null
            ] }),
            /* @__PURE__ */ a("div", { className: "space-y-2", children: [
              /* @__PURE__ */ e(c, { htmlFor: "currency", children: "Currency" }),
              /* @__PURE__ */ e(
                v,
                {
                  id: "currency",
                  value: b.currency,
                  onChange: (l) => P((k) => ({ ...k, currency: l.target.value })),
                  disabled: !_,
                  placeholder: "USD"
                }
              ),
              r?.currency ? /* @__PURE__ */ e("div", { className: "text-xs text-destructive", children: r.currency }) : null
            ] })
          ] })
        ] }),
        /* @__PURE__ */ a("div", { className: "grid gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "stock", children: "Stock (optional)" }),
            /* @__PURE__ */ e(
              v,
              {
                id: "stock",
                type: "number",
                value: b.stock,
                onChange: (l) => P((k) => ({ ...k, stock: l.target.value })),
                disabled: !_,
                min: 0
              }
            ),
            r?.stock ? /* @__PURE__ */ e("div", { className: "text-xs text-destructive", children: r.stock }) : null
          ] }),
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "status", children: "Status" }),
            /* @__PURE__ */ a(
              R,
              {
                value: b.status,
                onValueChange: (l) => P((k) => ({ ...k, status: l })),
                disabled: !_,
                children: [
                  /* @__PURE__ */ e(I, { children: /* @__PURE__ */ e(L, { placeholder: "Select status" }) }),
                  /* @__PURE__ */ a(E, { children: [
                    /* @__PURE__ */ e($, { value: "published", children: "Published" }),
                    /* @__PURE__ */ e($, { value: "draft", children: "Draft" })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ a("div", { className: "space-y-2", children: [
          /* @__PURE__ */ e(c, { htmlFor: "description", children: "Description" }),
          /* @__PURE__ */ e(
            ue,
            {
              id: "description",
              value: b.description,
              onChange: (l) => P((k) => ({ ...k, description: l.target.value })),
              disabled: !_,
              rows: 4
            }
          ),
          r?.description ? /* @__PURE__ */ e("div", { className: "text-xs text-destructive", children: r.description }) : null
        ] })
      ] }),
      /* @__PURE__ */ e(ce, { className: "justify-end", children: /* @__PURE__ */ e(y, { onClick: Ve, disabled: !Y || x, children: x ? "Creating…" : "Create product" }) })
    ] }),
    /* @__PURE__ */ e(we, { open: Z, onOpenChange: q, children: /* @__PURE__ */ a(Fe, { className: "max-h-[90vh] overflow-y-auto sm:max-w-3xl", children: [
      /* @__PURE__ */ a(Pe, { children: [
        /* @__PURE__ */ e($e, { children: "Edit product" }),
        /* @__PURE__ */ e(De, { children: "Update product details." })
      ] }),
      /* @__PURE__ */ a("div", { className: "space-y-4", children: [
        /* @__PURE__ */ a("div", { className: "grid gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "edit-name", children: "Name" }),
            /* @__PURE__ */ e(v, { id: "edit-name", value: T.name, onChange: (l) => B((k) => ({ ...k, name: l.target.value })) }),
            r?.name ? /* @__PURE__ */ e("div", { className: "text-xs text-destructive", children: r.name }) : null
          ] }),
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "edit-sku", children: "SKU" }),
            /* @__PURE__ */ e(v, { id: "edit-sku", value: T.sku, onChange: (l) => B((k) => ({ ...k, sku: l.target.value })) }),
            r?.sku ? /* @__PURE__ */ e("div", { className: "text-xs text-destructive", children: r.sku }) : null
          ] })
        ] }),
        /* @__PURE__ */ a("div", { className: "grid gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "edit-slug", children: "Slug" }),
            /* @__PURE__ */ e(v, { id: "edit-slug", value: T.slug, onChange: (l) => B((k) => ({ ...k, slug: l.target.value })) }),
            r?.slug ? /* @__PURE__ */ e("div", { className: "text-xs text-destructive", children: r.slug }) : null
          ] }),
          /* @__PURE__ */ a("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ a("div", { className: "space-y-2", children: [
              /* @__PURE__ */ e(c, { htmlFor: "edit-price", children: "Price" }),
              /* @__PURE__ */ e(
                v,
                {
                  id: "edit-price",
                  type: "number",
                  value: T.price,
                  onChange: (l) => B((k) => ({ ...k, price: l.target.value })),
                  min: 0,
                  step: 0.01
                }
              ),
              r?.price ? /* @__PURE__ */ e("div", { className: "text-xs text-destructive", children: r.price }) : null
            ] }),
            /* @__PURE__ */ a("div", { className: "space-y-2", children: [
              /* @__PURE__ */ e(c, { htmlFor: "edit-currency", children: "Currency" }),
              /* @__PURE__ */ e(
                v,
                {
                  id: "edit-currency",
                  value: T.currency,
                  onChange: (l) => B((k) => ({ ...k, currency: l.target.value }))
                }
              ),
              r?.currency ? /* @__PURE__ */ e("div", { className: "text-xs text-destructive", children: r.currency }) : null
            ] })
          ] })
        ] }),
        /* @__PURE__ */ a("div", { className: "grid gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "edit-stock", children: "Stock" }),
            /* @__PURE__ */ e(
              v,
              {
                id: "edit-stock",
                type: "number",
                value: T.stock,
                onChange: (l) => B((k) => ({ ...k, stock: l.target.value })),
                min: 0
              }
            ),
            r?.stock ? /* @__PURE__ */ e("div", { className: "text-xs text-destructive", children: r.stock }) : null
          ] }),
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "edit-status", children: "Status" }),
            /* @__PURE__ */ a(
              R,
              {
                value: T.status,
                onValueChange: (l) => B((k) => ({ ...k, status: l })),
                children: [
                  /* @__PURE__ */ e(I, { children: /* @__PURE__ */ e(L, { placeholder: "Select status" }) }),
                  /* @__PURE__ */ a(E, { children: [
                    /* @__PURE__ */ e($, { value: "published", children: "Published" }),
                    /* @__PURE__ */ e($, { value: "draft", children: "Draft" })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ e(
          Vt,
          {
            value: oe,
            onChange: (l) => ae((k) => ({ ...k, ...l })),
            categories: s,
            tags: d,
            errors: r
          }
        ),
        /* @__PURE__ */ a("div", { className: "space-y-2", children: [
          /* @__PURE__ */ e(c, { htmlFor: "edit-description", children: "Description" }),
          /* @__PURE__ */ e(
            ue,
            {
              id: "edit-description",
              value: T.description,
              onChange: (l) => B((k) => ({ ...k, description: l.target.value })),
              rows: 4
            }
          ),
          r?.description ? /* @__PURE__ */ e("div", { className: "text-xs text-destructive", children: r.description }) : null
        ] })
      ] }),
      /* @__PURE__ */ a(Ae, { children: [
        /* @__PURE__ */ e(y, { variant: "outline", onClick: () => q(!1), disabled: x, children: "Cancel" }),
        /* @__PURE__ */ e(y, { onClick: ze, disabled: x || !f, children: x ? "Saving…" : "Save changes" })
      ] })
    ] }) })
  ] }) : /* @__PURE__ */ e(U, { children: /* @__PURE__ */ a(V, { children: [
    /* @__PURE__ */ e(H, { children: "Products" }),
    /* @__PURE__ */ e(G, { children: "You do not have permission to view shop products." })
  ] }) });
}
function It({ shopProducts: t, productCategories: s, productTags: d, editProduct: o }) {
  const N = te();
  return /* @__PURE__ */ a(X, { title: "Products", description: "Manage your store products and inventory.", children: [
    /* @__PURE__ */ e(ee, { title: "Products" }),
    /* @__PURE__ */ e(
      Rt,
      {
        products: t,
        categories: s ?? [],
        tags: d ?? [],
        initialEdit: o ?? null,
        canView: N("view shop products"),
        canCreate: N("create shop products"),
        canEdit: N("edit shop products"),
        canDelete: N("delete shop products")
      }
    )
  ] });
}
const Lt = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
  { value: "AUD", label: "Australian Dollar (A$)" },
  { value: "JPY", label: "Japanese Yen (¥)" },
  { value: "CHF", label: "Swiss Franc (CHF)" },
  { value: "CNY", label: "Chinese Yuan (¥)" },
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "BRL", label: "Brazilian Real (R$)" }
];
function Et({ settings: t, canEdit: s, onSave: d }) {
  const [o, N] = w({
    store_name: t.store_name || "My Shop",
    currency: t.currency || "USD",
    currency_position: t.currency_position || "before",
    thousand_separator: t.thousand_separator || ",",
    decimal_separator: t.decimal_separator || ".",
    decimals: t.decimals ?? 2,
    products_per_page: t.products_per_page || 12,
    enable_reviews: t.enable_reviews ?? !1,
    enable_stock_management: t.enable_stock_management ?? !0,
    low_stock_threshold: t.low_stock_threshold || 5,
    out_of_stock_visibility: t.out_of_stock_visibility ?? !0,
    cart_page_id: t.cart_page_id || null,
    checkout_page_id: t.checkout_page_id || null,
    terms_page_id: t.terms_page_id || null,
    enable_checkout: t.enable_checkout ?? !0,
    invoice_details: t.invoice_details ?? "",
    tax_rate: t.tax_rate ?? 0,
    prices_include_tax: t.prices_include_tax ?? !1,
    shipping_methods: Array.isArray(t.shipping_methods) ? t.shipping_methods : []
  }), [_, f] = w(!1), g = (i, p) => {
    N((x) => ({ ...x, [i]: p }));
  }, h = (i, p) => {
    N((x) => ({
      ...x,
      shipping_methods: x.shipping_methods.map((O, n) => n === i ? { ...O, ...p } : O)
    }));
  };
  return /* @__PURE__ */ a("form", { onSubmit: async (i) => {
    if (i.preventDefault(), !!s) {
      f(!0);
      try {
        await d({
          ...o,
          tax_rate: Number(o.tax_rate) || 0,
          shipping_methods: o.shipping_methods.filter((p) => String(p.name).trim() !== "").map((p) => ({
            name: String(p.name).trim(),
            price: Number(p.price) || 0,
            free_over: p.free_over === "" || p.free_over === null ? null : Number(p.free_over)
          }))
        });
      } finally {
        f(!1);
      }
    }
  }, className: "space-y-6", children: [
    /* @__PURE__ */ e(U, { children: /* @__PURE__ */ a(Be, { defaultValue: "general", className: "w-full", children: [
      /* @__PURE__ */ e(V, { className: "pb-0", children: /* @__PURE__ */ a(He, { className: "h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0", children: [
        /* @__PURE__ */ a(
          se,
          {
            value: "general",
            className: "rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
            children: [
              /* @__PURE__ */ e(xt, { className: "mr-2 h-4 w-4" }),
              "General"
            ]
          }
        ),
        /* @__PURE__ */ a(
          se,
          {
            value: "currency",
            className: "rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
            children: [
              /* @__PURE__ */ e(nt, { className: "mr-2 h-4 w-4" }),
              "Currency"
            ]
          }
        ),
        /* @__PURE__ */ a(
          se,
          {
            value: "checkout",
            className: "rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
            children: [
              /* @__PURE__ */ e(kt, { className: "mr-2 h-4 w-4" }),
              "Tax & Shipping"
            ]
          }
        ),
        /* @__PURE__ */ a(
          se,
          {
            value: "inventory",
            className: "rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
            children: [
              /* @__PURE__ */ e(je, { className: "mr-2 h-4 w-4" }),
              "Inventory"
            ]
          }
        ),
        /* @__PURE__ */ a(
          se,
          {
            value: "pages",
            className: "rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
            children: [
              /* @__PURE__ */ e(_t, { className: "mr-2 h-4 w-4" }),
              "Pages"
            ]
          }
        )
      ] }) }),
      /* @__PURE__ */ a(K, { className: "pt-6", children: [
        /* @__PURE__ */ e(re, { value: "general", className: "mt-0 space-y-6", children: /* @__PURE__ */ a("div", { className: "grid gap-6 sm:grid-cols-2", children: [
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "store_name", children: "Store Name" }),
            /* @__PURE__ */ e(
              v,
              {
                id: "store_name",
                value: o.store_name,
                onChange: (i) => g("store_name", i.target.value),
                disabled: !s,
                placeholder: "My Shop"
              }
            )
          ] }),
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "products_per_page", children: "Products Per Page" }),
            /* @__PURE__ */ e(
              v,
              {
                id: "products_per_page",
                type: "number",
                min: 1,
                max: 100,
                value: o.products_per_page,
                onChange: (i) => g("products_per_page", parseInt(i.target.value) || 12),
                disabled: !s
              }
            )
          ] }),
          /* @__PURE__ */ a("div", { className: "space-y-2 sm:col-span-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "invoice_details", children: "Invoice details" }),
            /* @__PURE__ */ e(
              "textarea",
              {
                id: "invoice_details",
                rows: 3,
                value: o.invoice_details,
                onChange: (i) => g("invoice_details", i.target.value),
                disabled: !s,
                placeholder: `Company name
Street 1, 1234 AB City
VAT NL123456789B01`,
                className: "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
              }
            ),
            /* @__PURE__ */ e("p", { className: "text-xs text-muted-foreground", children: "Printed at the top of every invoice: your address, company and VAT numbers." })
          ] }),
          /* @__PURE__ */ a("div", { className: "flex items-center justify-between space-x-2 sm:col-span-2", children: [
            /* @__PURE__ */ a("div", { className: "space-y-0.5", children: [
              /* @__PURE__ */ e(c, { htmlFor: "enable_reviews", children: "Enable Product Reviews" }),
              /* @__PURE__ */ e("p", { className: "text-xs text-muted-foreground", children: "Allow customers to leave reviews on products" })
            ] }),
            /* @__PURE__ */ e(
              J,
              {
                id: "enable_reviews",
                checked: o.enable_reviews,
                onCheckedChange: (i) => g("enable_reviews", i),
                disabled: !s
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ e(re, { value: "currency", className: "mt-0 space-y-6", children: /* @__PURE__ */ a("div", { className: "grid gap-6 sm:grid-cols-2", children: [
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "currency", children: "Currency" }),
            /* @__PURE__ */ a(R, { value: o.currency, onValueChange: (i) => g("currency", i), disabled: !s, children: [
              /* @__PURE__ */ e(I, { children: /* @__PURE__ */ e(L, { placeholder: "Select currency" }) }),
              /* @__PURE__ */ e(E, { children: Lt.map((i) => /* @__PURE__ */ e($, { value: i.value, children: i.label }, i.value)) })
            ] })
          ] }),
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "currency_position", children: "Currency Position" }),
            /* @__PURE__ */ a(
              R,
              {
                value: o.currency_position,
                onValueChange: (i) => g("currency_position", i),
                disabled: !s,
                children: [
                  /* @__PURE__ */ e(I, { children: /* @__PURE__ */ e(L, {}) }),
                  /* @__PURE__ */ a(E, { children: [
                    /* @__PURE__ */ e($, { value: "before", children: "Before price ($99.99)" }),
                    /* @__PURE__ */ e($, { value: "after", children: "After price (99.99$)" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "thousand_separator", children: "Thousand Separator" }),
            /* @__PURE__ */ a(
              R,
              {
                value: o.thousand_separator,
                onValueChange: (i) => g("thousand_separator", i),
                disabled: !s,
                children: [
                  /* @__PURE__ */ e(I, { children: /* @__PURE__ */ e(L, {}) }),
                  /* @__PURE__ */ a(E, { children: [
                    /* @__PURE__ */ e($, { value: ",", children: "Comma (1,000)" }),
                    /* @__PURE__ */ e($, { value: ".", children: "Period (1.000)" }),
                    /* @__PURE__ */ e($, { value: " ", children: "Space (1 000)" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "decimal_separator", children: "Decimal Separator" }),
            /* @__PURE__ */ a(
              R,
              {
                value: o.decimal_separator,
                onValueChange: (i) => g("decimal_separator", i),
                disabled: !s,
                children: [
                  /* @__PURE__ */ e(I, { children: /* @__PURE__ */ e(L, {}) }),
                  /* @__PURE__ */ a(E, { children: [
                    /* @__PURE__ */ e($, { value: ".", children: "Period (99.99)" }),
                    /* @__PURE__ */ e($, { value: ",", children: "Comma (99,99)" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "decimals", children: "Number of Decimals" }),
            /* @__PURE__ */ e(
              v,
              {
                id: "decimals",
                type: "number",
                min: 0,
                max: 4,
                value: o.decimals,
                onChange: (i) => g("decimals", Number.isNaN(parseInt(i.target.value)) ? 2 : parseInt(i.target.value)),
                disabled: !s
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ a(re, { value: "checkout", className: "mt-0 space-y-6", children: [
          /* @__PURE__ */ a("div", { className: "grid gap-6 sm:grid-cols-2", children: [
            /* @__PURE__ */ a("div", { className: "flex items-center justify-between space-x-2 sm:col-span-2", children: [
              /* @__PURE__ */ a("div", { className: "space-y-0.5", children: [
                /* @__PURE__ */ e(c, { htmlFor: "enable_checkout", children: "Checkout open" }),
                /* @__PURE__ */ e("p", { className: "text-xs text-muted-foreground", children: "Switch off to keep the catalogue and cart but stop taking orders" })
              ] }),
              /* @__PURE__ */ e(
                J,
                {
                  id: "enable_checkout",
                  checked: o.enable_checkout,
                  onCheckedChange: (i) => g("enable_checkout", i),
                  disabled: !s
                }
              )
            ] }),
            /* @__PURE__ */ a("div", { className: "space-y-2", children: [
              /* @__PURE__ */ e(c, { htmlFor: "tax_rate", children: "Tax rate (%)" }),
              /* @__PURE__ */ e(
                v,
                {
                  id: "tax_rate",
                  type: "number",
                  min: 0,
                  max: 100,
                  step: "0.01",
                  value: o.tax_rate,
                  onChange: (i) => g("tax_rate", i.target.value),
                  disabled: !s
                }
              ),
              /* @__PURE__ */ e("p", { className: "text-xs text-muted-foreground", children: "Charged on products and shipping. 0 turns tax off." })
            ] }),
            /* @__PURE__ */ a("div", { className: "flex items-center justify-between space-x-2", children: [
              /* @__PURE__ */ a("div", { className: "space-y-0.5", children: [
                /* @__PURE__ */ e(c, { htmlFor: "prices_include_tax", children: "Prices include tax" }),
                /* @__PURE__ */ e("p", { className: "text-xs text-muted-foreground", children: "On: the price you enter is what customers pay. Off: tax is added at checkout." })
              ] }),
              /* @__PURE__ */ e(
                J,
                {
                  id: "prices_include_tax",
                  checked: o.prices_include_tax,
                  onCheckedChange: (i) => g("prices_include_tax", i),
                  disabled: !s
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ a("div", { className: "space-y-3", children: [
            /* @__PURE__ */ a("div", { children: [
              /* @__PURE__ */ e(c, { children: "Shipping methods" }),
              /* @__PURE__ */ e("p", { className: "text-xs text-muted-foreground", children: 'Customers pick one at checkout. Leave "Free over" empty for no free-shipping threshold. No methods means no shipping charge.' })
            ] }),
            o.shipping_methods.map((i, p) => /* @__PURE__ */ a("div", { className: "grid grid-cols-[1fr_7rem_7rem_auto] items-end gap-2", children: [
              /* @__PURE__ */ a("div", { className: "space-y-1", children: [
                /* @__PURE__ */ e(c, { htmlFor: `sm-name-${p}`, className: "text-xs", children: "Name" }),
                /* @__PURE__ */ e(
                  v,
                  {
                    id: `sm-name-${p}`,
                    value: i.name,
                    onChange: (x) => h(p, { name: x.target.value }),
                    placeholder: "Standard",
                    disabled: !s
                  }
                )
              ] }),
              /* @__PURE__ */ a("div", { className: "space-y-1", children: [
                /* @__PURE__ */ e(c, { htmlFor: `sm-price-${p}`, className: "text-xs", children: "Price" }),
                /* @__PURE__ */ e(
                  v,
                  {
                    id: `sm-price-${p}`,
                    type: "number",
                    min: 0,
                    step: "0.01",
                    value: i.price,
                    onChange: (x) => h(p, { price: x.target.value }),
                    disabled: !s
                  }
                )
              ] }),
              /* @__PURE__ */ a("div", { className: "space-y-1", children: [
                /* @__PURE__ */ e(c, { htmlFor: `sm-free-${p}`, className: "text-xs", children: "Free over" }),
                /* @__PURE__ */ e(
                  v,
                  {
                    id: `sm-free-${p}`,
                    type: "number",
                    min: 0,
                    step: "0.01",
                    value: i.free_over ?? "",
                    onChange: (x) => h(p, { free_over: x.target.value }),
                    disabled: !s
                  }
                )
              ] }),
              /* @__PURE__ */ e(
                y,
                {
                  type: "button",
                  variant: "ghost",
                  size: "icon",
                  "aria-label": `Remove ${i.name || "shipping method"}`,
                  onClick: () => N((x) => ({
                    ...x,
                    shipping_methods: x.shipping_methods.filter((O, n) => n !== p)
                  })),
                  disabled: !s,
                  children: /* @__PURE__ */ e(Ue, { className: "h-4 w-4" })
                }
              )
            ] }, p)),
            /* @__PURE__ */ a(
              y,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => N((i) => ({
                  ...i,
                  shipping_methods: [...i.shipping_methods, { name: "", price: 0, free_over: null }]
                })),
                disabled: !s || o.shipping_methods.length >= 20,
                children: [
                  /* @__PURE__ */ e(me, { className: "mr-2 h-4 w-4" }),
                  "Add shipping method"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ e(re, { value: "inventory", className: "mt-0 space-y-6", children: /* @__PURE__ */ a("div", { className: "grid gap-6 sm:grid-cols-2", children: [
          /* @__PURE__ */ a("div", { className: "flex items-center justify-between space-x-2 sm:col-span-2", children: [
            /* @__PURE__ */ a("div", { className: "space-y-0.5", children: [
              /* @__PURE__ */ e(c, { htmlFor: "enable_stock_management", children: "Enable Stock Management" }),
              /* @__PURE__ */ e("p", { className: "text-xs text-muted-foreground", children: "Track inventory levels for products" })
            ] }),
            /* @__PURE__ */ e(
              J,
              {
                id: "enable_stock_management",
                checked: o.enable_stock_management,
                onCheckedChange: (i) => g("enable_stock_management", i),
                disabled: !s
              }
            )
          ] }),
          o.enable_stock_management && /* @__PURE__ */ a(ye, { children: [
            /* @__PURE__ */ a("div", { className: "space-y-2", children: [
              /* @__PURE__ */ e(c, { htmlFor: "low_stock_threshold", children: "Low Stock Threshold" }),
              /* @__PURE__ */ e(
                v,
                {
                  id: "low_stock_threshold",
                  type: "number",
                  min: 0,
                  value: o.low_stock_threshold,
                  onChange: (i) => g("low_stock_threshold", parseInt(i.target.value) || 5),
                  disabled: !s
                }
              ),
              /* @__PURE__ */ e("p", { className: "text-xs text-muted-foreground", children: "Alert when stock falls below this number" })
            ] }),
            /* @__PURE__ */ a("div", { className: "flex items-center justify-between space-x-2", children: [
              /* @__PURE__ */ a("div", { className: "space-y-0.5", children: [
                /* @__PURE__ */ e(c, { htmlFor: "out_of_stock_visibility", children: "Show Out of Stock Products" }),
                /* @__PURE__ */ e("p", { className: "text-xs text-muted-foreground", children: "Display products even when out of stock" })
              ] }),
              /* @__PURE__ */ e(
                J,
                {
                  id: "out_of_stock_visibility",
                  checked: o.out_of_stock_visibility,
                  onCheckedChange: (i) => g("out_of_stock_visibility", i),
                  disabled: !s
                }
              )
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ e(re, { value: "pages", className: "mt-0 space-y-6", children: /* @__PURE__ */ a("div", { className: "grid gap-6 sm:grid-cols-2", children: [
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "cart_page_id", children: "Cart Page ID" }),
            /* @__PURE__ */ e(
              v,
              {
                id: "cart_page_id",
                type: "number",
                value: o.cart_page_id || "",
                onChange: (i) => g("cart_page_id", i.target.value ? parseInt(i.target.value) : null),
                disabled: !s,
                placeholder: "Leave empty for default"
              }
            )
          ] }),
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "checkout_page_id", children: "Checkout Page ID" }),
            /* @__PURE__ */ e(
              v,
              {
                id: "checkout_page_id",
                type: "number",
                value: o.checkout_page_id || "",
                onChange: (i) => g("checkout_page_id", i.target.value ? parseInt(i.target.value) : null),
                disabled: !s,
                placeholder: "Leave empty for default"
              }
            )
          ] }),
          /* @__PURE__ */ a("div", { className: "space-y-2", children: [
            /* @__PURE__ */ e(c, { htmlFor: "terms_page_id", children: "Terms & Conditions Page ID" }),
            /* @__PURE__ */ e(
              v,
              {
                id: "terms_page_id",
                type: "number",
                value: o.terms_page_id || "",
                onChange: (i) => g("terms_page_id", i.target.value ? parseInt(i.target.value) : null),
                disabled: !s,
                placeholder: "Leave empty for default"
              }
            )
          ] })
        ] }) })
      ] })
    ] }) }),
    s && /* @__PURE__ */ e("div", { className: "flex justify-end", children: /* @__PURE__ */ a(y, { type: "submit", disabled: _, children: [
      /* @__PURE__ */ e(pt, { className: "mr-2 h-4 w-4" }),
      _ ? "Saving..." : "Save Settings"
    ] }) })
  ] });
}
function Bt({ shopSettings: t }) {
  const s = te(), d = de();
  return /* @__PURE__ */ a(X, { title: "Shop settings", description: "Your store's name, currency, taxes, shipping and checkout.", children: [
    /* @__PURE__ */ e(ee, { title: "Shop settings" }),
    /* @__PURE__ */ e(
      Et,
      {
        settings: t || {},
        canEdit: s("manage shop settings"),
        onSave: (o) => F.put(route("dashboard.admin.shop.settings.update"), o, {
          preserveScroll: !0,
          onError: () => d.error("The shop settings could not be saved. Check the highlighted fields.")
        })
      }
    )
  ] });
}
window.Modulo.registerComponents("modulo-shop", {
  Products: It,
  Orders: $t,
  OrderView: Ot,
  Coupons: Ft,
  Payments: Ut,
  Settings: Bt
});
