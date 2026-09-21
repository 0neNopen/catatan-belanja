/**
 * Utilitas Driver Printer Thermal Bluetooth (ESC/POS)
 * Menangani format struk 32 kolom dan transmisi Web Bluetooth GATT
 * Mendukung opsi penyertaan nama toko pada baris ke-2
 */

export function formatReceiptItem(
  qty,
  name,
  unit,
  store,
  priceStr,
  includeStore = true,
  lineWidth = 32
) {
  const indent = '     '
  let unitText = unit ? (unit.startsWith('/') ? unit : `/${unit}`) : '-'

  if (includeStore && store && store.trim()) {
    const trimmed = store.trim()
    const truncatedStore = trimmed.length > 10 ? trimmed.slice(0, 9) + '…' : trimmed
    unitText += ` · ${truncatedStore}`
  }

  const line1 = `- ${qty}  ${name}\n`
  const spaceCount = Math.max(2, lineWidth - indent.length - unitText.length - priceStr.length)
  const line2 = `${indent}${unitText}${' '.repeat(spaceCount)}${priceStr}\n`
  return line1 + line2
}

export function buildReceiptEscPos({
  type,
  items,
  entry,
  getQty = () => 1,
  includeStore = true,
}) {
  const now = new Date()
  const printTimeStr =
    now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' +
    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  let text = '\x1B\x40' // Init printer
  text += '\x1B\x61\x01' // Align center
  text += type === 'history' ? 'RIWAYAT PEMBELIAN\n' : 'CATATAN BELANJA\n'
  text += `Waktu: ${printTimeStr}\n`
  text += '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n'
  text += '\x1B\x61\x00' // Align left

  let total = 0
  const itemsToPrint = type === 'active' ? items : entry?.items || []

  if (type === 'active') {
    itemsToPrint.forEach((item) => {
      const qty = getQty(item.id)
      const unit = item.units?.name || item.unit || '-'
      const store = item.store_name || item.store || ''
      const unitPrice = Number(item.price) || 0
      const subtotal = unitPrice * qty
      const priceStr = subtotal ? `Rp${subtotal.toLocaleString('id-ID')}` : 'Rp0'
      text += formatReceiptItem(qty, item.name, unit, store, priceStr, includeStore, 32)
      total += subtotal
    })
  } else {
    const grouped = itemsToPrint.reduce((acc, item) => {
      const cat = item.category || 'Tanpa kategori'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    }, {})

    Object.entries(grouped).forEach(([catName, groupItems], groupIndex) => {
      if (groupIndex > 0) text += '\n'
      text += `===> ${catName.toUpperCase()}\n`
      groupItems.forEach((item) => {
        const qty = item.quantity || 1
        const unit = item.unit || (item.units?.name ? item.units.name : '-')
        const store = item.store || item.store_name || ''
        const unitPrice = Number(item.price) || 0
        const subtotal = unitPrice * qty
        const priceStr = subtotal ? `Rp${subtotal.toLocaleString('id-ID')}` : 'Rp0'
        text += formatReceiptItem(qty, item.name, unit, store, priceStr, includeStore, 32)
        total += subtotal
      })
    })
  }

  const totalQty = itemsToPrint.reduce(
    (sum, item) => sum + (type === 'active' ? getQty(item.id) : item.quantity || 1),
    0
  )

  text += '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n'
  text += `Total Barang: ${totalQty} item\n`
  text += `Total: Rp${total.toLocaleString('id-ID')}\n`
  text += '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n'
  text += '\n\n\n'

  return text
}

export async function printReceiptBluetooth({
  type,
  items,
  entry,
  getQty,
  includeStore = true,
  onStatus,
}) {
  if (!navigator.bluetooth) {
    throw new Error('Browser pada perangkat ini tidak mendukung koneksi Bluetooth langsung.')
  }

  const itemsToPrint = type === 'active' ? items : entry?.items || []
  if (!itemsToPrint || itemsToPrint.length === 0) {
    throw new Error('Tidak ada barang untuk dicetak.')
  }

  const text = buildReceiptEscPos({ type, items, entry, getQty, includeStore })

  let device = null
  try {
    if (onStatus) onStatus('Pilih printer Bluetooth Anda...')
    device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard thermal printer service
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Serial Port Profile
      ],
    })

    if (onStatus) onStatus('Menghubungkan ke printer...')
    const server = await device.gatt.connect()
    const services = await server.getPrimaryServices()
    let printCharacteristic = null

    for (const service of services) {
      const characteristics = await service.getCharacteristics()
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          printCharacteristic = char
          break
        }
      }
      if (printCharacteristic) break
    }

    if (!printCharacteristic) {
      throw new Error('Karakteristik write tidak ditemukan pada printer ini.')
    }

    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const chunkSize = 512

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      if (printCharacteristic.properties.write) {
        await printCharacteristic.writeValue(chunk)
      } else {
        await printCharacteristic.writeValueWithoutResponse(chunk)
      }
    }

    if (onStatus) onStatus('Berhasil mencetak struk!')
    setTimeout(() => {
      if (device?.gatt?.connected) device.gatt.disconnect()
    }, 2500)

    return { success: true }
  } catch (err) {
    if (device?.gatt?.connected) {
      try {
        device.gatt.disconnect()
      } catch {}
    }
    throw err
  }
}
