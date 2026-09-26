@php
    $fmt = function ($amount) use ($money, $order) {
        $number = number_format((float) $amount, $money['decimals'], $money['decimal'], $money['thousand']);
        return $money['position'] === 'after' ? $number.' '.$order->currency : $order->currency.' '.$number;
    };
    $includesTax = (bool) ($order->meta_data['prices_include_tax'] ?? false);
    $taxRate = $order->meta_data['tax_rate'] ?? null;
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Invoice {{ $order->order_number }} · {{ $store['name'] }}</title>
    <style nonce="{{ \Illuminate\Support\Facades\Vite::cspNonce() }}">
        * { box-sizing: border-box; }
        body { margin: 0; background: #f4f4f5; color: #18181b; font: 14px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
        .page { max-width: 820px; margin: 24px auto; background: #fff; padding: 48px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
        header { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 40px; }
        h1 { margin: 0 0 4px; font-size: 28px; letter-spacing: -.02em; }
        h2 { margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #71717a; }
        .muted { color: #71717a; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #71717a; border-bottom: 2px solid #e4e4e7; padding: 8px 0; }
        td { border-bottom: 1px solid #f4f4f5; padding: 10px 0; vertical-align: top; }
        .num { text-align: right; white-space: nowrap; }
        .totals { margin-left: auto; width: 300px; margin-top: 16px; }
        .totals td { border: 0; padding: 4px 0; }
        .totals .grand td { border-top: 2px solid #18181b; padding-top: 10px; font-size: 16px; font-weight: 700; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #fef3c7; color: #92400e; }
        .badge.paid { background: #dcfce7; color: #166534; }
        .actions { max-width: 820px; margin: 0 auto; text-align: right; padding: 0 4px; }
        button { font: inherit; padding: 8px 16px; border-radius: 6px; border: 1px solid #d4d4d8; background: #fff; cursor: pointer; }
        footer { margin-top: 40px; font-size: 12px; }
        @media (max-width: 640px) { .page { padding: 24px; margin: 0; border-radius: 0; } .grid, header { grid-template-columns: 1fr; flex-direction: column; } .totals { width: 100%; } }
        @media print { body { background: #fff; } .page { box-shadow: none; margin: 0; max-width: none; } .actions { display: none; } }
    </style>
</head>
<body>
    <div class="actions"><button type="button" id="print">Print / Save as PDF</button></div>

    <main class="page">
        <header>
            <div>
                <h1>Invoice</h1>
                <div class="muted">{{ $order->order_number }} · {{ $order->created_at?->format('j F Y') }}</div>
            </div>
            <div style="text-align:right">
                <strong>{{ $store['name'] }}</strong><br>
                @if ($store['details'])
                    {!! nl2br(e($store['details'])) !!}<br>
                @endif
                <span class="muted">{{ $store['url'] }}</span>
                @if ($store['email'])<br><span class="muted">{{ $store['email'] }}</span>@endif
            </div>
        </header>

        <div class="grid">
            <section>
                <h2>Bill to</h2>
                <strong>{{ $order->customer_name }}</strong><br>
                {{ $order->billing_address_1 }}<br>
                @if ($order->billing_address_2){{ $order->billing_address_2 }}<br>@endif
                {{ $order->billing_postcode }} {{ $order->billing_city }}@if ($order->billing_state), {{ $order->billing_state }}@endif<br>
                {{ $order->billing_country }}<br>
                <span class="muted">{{ $order->customer_email }}</span>
            </section>
            <section>
                <h2>Payment</h2>
                {{ $paymentLabel }}<br>
                <span class="badge {{ $order->payment_status === 'paid' ? 'paid' : '' }}">{{ $order->getPaymentStatusLabel() }}</span>
                @if ($order->paid_at)<div class="muted">Paid {{ $order->paid_at->format('j F Y') }}</div>@endif
                @if ($order->shipping_method)
                    <h2 style="margin-top:16px">Shipping</h2>
                    {{ $order->shipping_method }}
                @endif
            </section>
        </div>

        <table>
            <thead>
                <tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Amount</th></tr>
            </thead>
            <tbody>
                @foreach ($order->items as $item)
                    <tr>
                        <td>{{ $item->product_name }}@if ($item->product_sku)<br><span class="muted">{{ $item->product_sku }}</span>@endif</td>
                        <td class="num">{{ $item->quantity }}</td>
                        <td class="num">{{ $fmt($item->price) }}</td>
                        <td class="num">{{ $fmt($item->subtotal) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <table class="totals">
            <tr><td>Subtotal</td><td class="num">{{ $fmt($order->subtotal) }}</td></tr>
            @if ((float) $order->discount > 0)
                <tr><td>Discount{{ $order->coupon_code ? ' ('.$order->coupon_code.')' : '' }}</td><td class="num">-{{ $fmt($order->discount) }}</td></tr>
            @endif
            <tr><td>Shipping</td><td class="num">{{ $fmt($order->shipping) }}</td></tr>
            @if ((float) $order->tax > 0)
                <tr><td>{{ $includesTax ? 'Includes tax' : 'Tax' }}{{ $taxRate ? ' ('.rtrim(rtrim(number_format((float) $taxRate, 2, '.', ''), '0'), '.').'%)' : '' }}</td><td class="num">{{ $fmt($order->tax) }}</td></tr>
            @endif
            <tr class="grand"><td>Total</td><td class="num">{{ $fmt($order->total) }}</td></tr>
        </table>

        <footer class="muted">Thank you for your order. Please quote {{ $order->order_number }} with any question.</footer>
    </main>

    <script nonce="{{ \Illuminate\Support\Facades\Vite::cspNonce() }}">
        document.getElementById('print').addEventListener('click', () => window.print());
    </script>
</body>
</html>
