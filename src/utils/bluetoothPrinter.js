/**
 * Utilitas Driver Printer Thermal Bluetooth (ESC/POS)
 * Menangani format struk 32 kolom ASCII murni dan transmisi Web Bluetooth GATT
 * Memastikan tidak ada karakter non-ASCII (menghindari simbol aneh & overflow baris)
 */

function wrapItemName(qty, name, lineWidth = 32) {
  const prefix = `- ${qty} `
  const maxFirstLine = Math.max(10, lineWidth - prefix.length)
  const maxNextLine = lineWidth - 4 // indent 4 spasi

  const words = name.trim().split(/\s+/)
  let firstLine = ''
  let remainingWordsIndex = 0

  for (let i = 0; i < words.length; i++) {
    const testLine = firstLine ? `${firstLine} ${words[i]}` : words[i]
    if (testLine.length <= maxFirstLine) {
      firstLine = testLine
      remainingWordsIndex = i + 1
    } else {
      break
    }
  }

  // Jika kata pertama saja sudah lebih panjang dari batas baris pertama
  if (!firstLine && words.length > 0) {
    firstLine = words[0].slice(0, maxFirstLine)
    words[0] = words[0].slice(maxFirstLine)
    remainingWordsIndex = 0
  }

  let result = `${prefix}${firstLine}\n`

  // Baris-baris lanjutan nama barang dengan indent 4 spasi
  let currentLine = ''
  for (let i = remainingWordsIndex; i < words.length; i++) {
    const word = words[i]
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (testLine.length <= maxNextLine) {
      currentLine = testLine
    } else {
      if (currentLine) {
        result += `    ${currentLine}\n`
      }
      if (word.length > maxNextLine) {
        result += `    ${word.slice(0, maxNextLine)}\n`
        currentLine = word.slice(maxNextLine)
      } else {
        currentLine = word
      }
    }
  }

  if (currentLine) {
    result += `    ${currentLine}\n`
  }

  return result
}

export function formatReceiptItem(
  qty,
  name,
  unit,
  store,
  priceStr,
  includeStore = true,
  lineWidth = 32,
  pieces = null,
  pieceUnit = ''
) {
  // Jika memiliki rincian isi paket > 1, sematkan (isi ... [satuan]) di baris 1 nama barang
  const piecesNum = Number(pieces) || 0
  const unitSuffix = pieceUnit && pieceUnit.trim() ? ` ${pieceUnit.trim()}` : ''
  const fullName = piecesNum > 1 ? `${name} (isi ${piecesNum}${unitSuffix})` : name

  // Baris 1: Nama barang dengan smart word-wrap rapi
  const line1 = wrapItemName(qty, fullName, lineWidth)

  // Baris 2: Satuan, Nama Toko (opsional dlm kurung ASCII), dan Harga rata kanan
  const indent = '    '
  let unitText = unit ? (unit.startsWith('/') ? unit : `/${unit}`) : '-'

  if (includeStore && store && store.trim()) {
    const cleanStore = store.trim()
    // Hitung sisa ruang maksimal untuk teks toko agar harga tidak terdorong keluar batas 32 karakter
    const maxStoreLen = Math.max(4, lineWidth - indent.length - unitText.length - priceStr.length - 4)
    let formattedStore = cleanStore
    if (cleanStore.length > maxStoreLen) {
      formattedStore = cleanStore.slice(0, Math.max(1, maxStoreLen - 2)) + '..'
    }
    unitText += ` (${formattedStore})`
  }

  const spaceCount = Math.max(1, lineWidth - indent.length - unitText.length - priceStr.length)
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
      const pieces = item.pieces_per_unit || null
      const pieceUnit = item.piece_unit || ''
      text += formatReceiptItem(qty, item.name, unit, store, priceStr, includeStore, 32, pieces, pieceUnit)
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
        const pieces = item.pieces_per_unit || item.pieces || null
        const pieceUnit = item.piece_unit || ''
        text += formatReceiptItem(qty, item.name, unit, store, priceStr, includeStore, 32, pieces, pieceUnit)
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
