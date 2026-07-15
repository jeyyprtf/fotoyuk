import type { Lang } from './types'

const dict = {
  id: {
    brand: 'FotoYuk',
    tagline: 'Photobooth di browser kamu. Privat, cute, no drama.',
    start: 'Mulai foto',
    gallery: 'Galeri',
    terms: 'Syarat',
    privacy: 'Privasi',
    layoutLabel: 'Layout',
    frameLabel: 'Frame',
    effectsLabel: 'Efek',
    skinLabel: 'Skin tone',
    arLabel: 'AR lucu',
    stickers: 'Stiker',
    mirror: 'Mirror',
    capture: 'Jepret!',
    nextShot: 'Shot berikutnya…',
    printing: 'Nge-print dulu yaa…',
    retake: 'Ulangi',
    edit: 'Edit',
    done: 'Selesai',
    download: 'Download',
    share: 'Share',
    delete: 'Hapus',
    clearAll: 'Hapus semua',
    emptyGallery: 'Belum ada foto. Yuk jepret dulu!',
    saveToGallery: 'Simpan ke galeri',
    saved: 'Tersimpan!',
    addText: 'Tambah teks',
    addEmoji: 'Emoji',
    cameraError: 'Kamera gak bisa dibuka. Cek izin browser ya.',
    permissionHint: 'Butuh izin kamera. Tekan allow di popup browser.',
    loadingAr: 'Loading filter wajah…',
    arFail: 'AR gak ready — pakai stiker manual aja ✨',
    countdown: 'Siap-siap!',
    back: 'Kembali',
    home: 'Beranda',
    continue: 'Lanjut',
    textPlaceholder: 'Tulis sesuatu…',
    confirmDelete: 'Hapus foto ini?',
    confirmClear: 'Hapus semua foto di galeri?',
    privacyBadge: 'Foto cuma di device kamu',
    footerNote: 'Dibuat dengan 💕 · foto tidak diupload',
    shotOf: 'Foto {n} dari {total}',
    layouts: { '1x1': 'Single', '2x2': '2×2', '2x3': '2×3', '2x4': 'Strip 2×4' },
    frames: {
      polaroid: 'Polaroid',
      pastel: 'Pastel',
      film: 'Film',
      doodle: 'Doodle',
      minimal: 'Minimal',
    },
    effects: {
      none: 'Normal',
      soft: 'Soft glow',
      vignette: 'Vignette',
      grain: 'Grain',
      leak: 'Light leak',
      bw: 'B&W',
      warm: 'Warm',
      cool: 'Cool',
    },
    skins: {
      none: 'Natural',
      glow: 'Soft glow',
      peach: 'Warm peach',
      porcelain: 'Cool porcelain',
      even: 'Even tone',
    },
    ars: {
      none: 'Tanpa AR',
      dog: 'Kuping anjing',
      cat: 'Kuping kucing',
      hearts: 'Love float',
      sparkle: 'Sparkle',
    },
    termsTitle: 'Syarat & Ketentuan',
    privacyTitle: 'Kebijakan Privasi',
    termsBody: `Selamat datang di FotoYuk.

1. Layanan. FotoYuk adalah photobooth berbasis web yang berjalan di browser perangkat Anda.
2. Tidak ada akun. Anda tidak perlu mendaftar untuk memakai fitur inti.
3. Konten. Anda bertanggung jawab atas foto yang Anda ambil dan bagikan. Jangan gunakan layanan ini untuk konten ilegal atau yang melanggar hak orang lain.
4. Kekayaan intelektual. UI, brand FotoYuk, dan aset bawaan milik pengelola. Stiker/emoji berbasis karakter unicode publik.
5. Ketersediaan. Layanan disediakan "sebagaimana adanya". Kami bisa mengubah atau menghentikan fitur tanpa pemberitahuan.
6. Batasan tanggung jawab. Kami tidak bertanggung jawab atas kehilangan data di perangkat Anda, kegagalan kamera, atau penggunaan share ke pihak ketiga.
7. Usia. Disarankan untuk pengguna yang memahami izin kamera dan berbagi konten secara bijak.
8. Perubahan. Syarat ini bisa diperbarui; versi terbaru selalu di halaman ini.
9. Kontak. Untuk pertanyaan terkait layanan: hubungi pemilik domain juan.web.id.

Dengan memakai FotoYuk, Anda menyetujui syarat ini.`,
    privacyBody: `Privasi Anda penting.

1. Foto tidak pernah diupload. Stream kamera, proses filter, AR, edit, dan export terjadi 100% di browser Anda. Server kami tidak menerima file foto Anda.
2. Penyimpanan lokal. Galeri disimpan di IndexedDB/local storage perangkat Anda. Menghapus data situs browser akan menghapus galeri.
3. Izin kamera. Hanya dipakai saat Anda membuka booth. Stream dihentikan saat Anda keluar.
4. Face landmarks. Deteksi wajah (jika AR aktif) diproses lokal lewat model di perangkat. Tidak dikirim ke server.
5. Telemetri. Kami mengumpulkan event anonim (mis. page view, filter dipilih, download diklik) tanpa PII dan tanpa gambar, untuk memahami pemakaian fitur.
6. Cookie/analytics. Vercel Analytics atau setara untuk pageview agregat.
7. Pihak ketiga. Jika Anda memakai Share ke app lain, data mengikuti kebijakan app tersebut.
8. Hak Anda. Hapus galeri di app, atau clear site data di browser kapan saja.
9. Anak-anak. Jangan bagikan data sensitif. Pengawasan orang tua disarankan untuk pengguna muda.
10. Perubahan. Kebijakan ini bisa diperbarui di halaman ini.

Pertanyaan privasi: hubungi pemilik domain juan.web.id.`,
  },
  en: {
    brand: 'FotoYuk',
    tagline: 'Photobooth in your browser. Private, cute, no drama.',
    start: 'Start booth',
    gallery: 'Gallery',
    terms: 'Terms',
    privacy: 'Privacy',
    layoutLabel: 'Layout',
    frameLabel: 'Frame',
    effectsLabel: 'Effects',
    skinLabel: 'Skin tone',
    arLabel: 'Cute AR',
    stickers: 'Stickers',
    mirror: 'Mirror',
    capture: 'Snap!',
    nextShot: 'Next shot…',
    printing: 'Printing your strip…',
    retake: 'Retake',
    edit: 'Edit',
    done: 'Done',
    download: 'Download',
    share: 'Share',
    delete: 'Delete',
    clearAll: 'Clear all',
    emptyGallery: 'No photos yet. Go snap some!',
    saveToGallery: 'Save to gallery',
    saved: 'Saved!',
    addText: 'Add text',
    addEmoji: 'Emoji',
    cameraError: "Can't open camera. Check browser permission.",
    permissionHint: 'Camera permission needed. Tap allow on the browser prompt.',
    loadingAr: 'Loading face filter…',
    arFail: 'AR unavailable — use manual stickers ✨',
    countdown: 'Get ready!',
    back: 'Back',
    home: 'Home',
    continue: 'Continue',
    textPlaceholder: 'Type something…',
    confirmDelete: 'Delete this photo?',
    confirmClear: 'Delete all gallery photos?',
    privacyBadge: 'Photos stay on your device',
    footerNote: 'Made with 💕 · photos never uploaded',
    shotOf: 'Shot {n} of {total}',
    layouts: { '1x1': 'Single', '2x2': '2×2', '2x3': '2×3', '2x4': 'Strip 2×4' },
    frames: {
      polaroid: 'Polaroid',
      pastel: 'Pastel',
      film: 'Film',
      doodle: 'Doodle',
      minimal: 'Minimal',
    },
    effects: {
      none: 'Normal',
      soft: 'Soft glow',
      vignette: 'Vignette',
      grain: 'Grain',
      leak: 'Light leak',
      bw: 'B&W',
      warm: 'Warm',
      cool: 'Cool',
    },
    skins: {
      none: 'Natural',
      glow: 'Soft glow',
      peach: 'Warm peach',
      porcelain: 'Cool porcelain',
      even: 'Even tone',
    },
    ars: {
      none: 'No AR',
      dog: 'Dog ears',
      cat: 'Cat ears',
      hearts: 'Floating hearts',
      sparkle: 'Sparkle',
    },
    termsTitle: 'Terms & Conditions',
    privacyTitle: 'Privacy Policy',
    termsBody: `Welcome to FotoYuk.

1. Service. FotoYuk is a browser-based photobooth that runs on your device.
2. No account. Core features do not require registration.
3. Content. You are responsible for photos you take and share. Do not use this service for illegal content or content that violates others' rights.
4. IP. FotoYuk UI, brand, and bundled assets belong to the operator. Stickers/emoji use public unicode characters.
5. Availability. Service is provided "as is". Features may change or stop without notice.
6. Liability. We are not liable for local data loss, camera failures, or third-party share targets.
7. Age. Recommended for users who understand camera permissions and responsible sharing.
8. Changes. These terms may be updated; the latest version is always on this page.
9. Contact. Questions: contact the owner of juan.web.id.

By using FotoYuk you accept these terms.`,
    privacyBody: `Your privacy matters.

1. Photos are never uploaded. Camera stream, filters, AR, editing, and export run 100% in your browser. Our servers do not receive your photo files.
2. Local storage. Gallery lives in your device IndexedDB/local storage. Clearing site data removes it.
3. Camera permission. Used only while the booth is open. Stream stops when you leave.
4. Face landmarks. Face detection (when AR is on) runs locally. Not sent to servers.
5. Telemetry. We collect anonymous events (page views, filter picks, download clicks) with no PII and no images, to understand feature use.
6. Analytics. Vercel Analytics or equivalent for aggregate pageviews.
7. Third parties. If you Share to another app, that app's policy applies.
8. Your rights. Delete gallery in-app, or clear site data anytime.
9. Children. Do not share sensitive data. Parental guidance recommended for young users.
10. Changes. This policy may be updated on this page.

Privacy questions: contact the owner of juan.web.id.`,
  },
} as const

export type Dict = (typeof dict)[Lang]

export function t(lang: Lang): Dict {
  return dict[lang] as Dict
}

export function tf(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}
