import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { listingService } from '../services/listingService.js'
import { Button, Input, ErrorMsg } from '../components/ui/index.jsx'

export const CreateListing = () => {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '', description: '', category: 'electronics',
    condition: 'good', listing_type: 'auction',
    starting_price: '', buy_now_price: '', auction_end_time: '',
  })
  const [images, setImages]       = useState([])      // File objects
  const [previews, setPreviews]   = useState([])      // Data URLs for preview
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const fileInputRef              = useRef(null)

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  // Handle image file selection — create previews
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    if (images.length + files.length > 5) {
      return setError('Maximum 5 images allowed')
    }

    const validFiles = files.filter(f =>
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type)
    )

    if (validFiles.length !== files.length) {
      setError('Only JPEG, PNG and WebP images allowed')
    }

    // Generate preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target.result])
      }
      reader.readAsDataURL(file)
    })

    setImages(prev => [...prev, ...validFiles])
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title || !form.description || !form.starting_price)
      return setError('Title, description, and starting price are required')

    if (form.listing_type === 'auction' && !form.auction_end_time)
      return setError('Auction end time is required')

    setLoading(true)
    try {
      /*
        WHY FormData instead of JSON?
        ──────────────────────────────
        JSON cannot carry binary file data (images).
        FormData is multipart/form-data — it packages text fields
        AND binary files into one HTTP request.
        Multer on the backend reads this format.
      */
      const formData = new FormData()

      // Append all text fields
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key, value)
      })

      // Append each image file under the key 'images'
      // Multer looks for this key: multerUpload.array('images', 5)
      images.forEach(file => formData.append('images', file))

      const data = await listingService.createListing(formData)
      navigate(`/listings/${data.listing._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create listing')
    } finally {
      setLoading(false)
    }
  }

  const minDateTime = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Post an Item</h1>
        <p className="text-slate-500 text-sm mt-1">List something for your college community</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Image upload */}
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-2">
            Photos <span className="text-slate-400 font-normal">(up to 5)</span>
          </label>

          <div className="flex flex-wrap gap-3">
            {/* Existing previews */}
            {previews.map((src, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200 group">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                             transition-opacity flex items-center justify-center text-white text-lg"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Add more button */}
            {images.length < 5 && (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300
                           flex flex-col items-center justify-center gap-1
                           hover:border-indigo-400 hover:bg-indigo-50 transition-all text-slate-400 hover:text-indigo-500"
              >
                <span className="text-2xl">+</span>
                <span className="text-xs font-medium">Add Photo</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <p className="text-xs text-slate-400 mt-2">JPEG, PNG or WebP · Max 5MB each</p>
        </div>

        <Input label="Item Title" name="title" value={form.title}
          onChange={handleChange} placeholder="Dell Laptop - 8GB RAM" required />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea name="description" value={form.description} onChange={handleChange}
            rows={4} placeholder="Describe your item — condition, age, what's included..."
            className="border-2 border-slate-200 rounded-xl px-4 py-3 text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400
                       hover:border-slate-300 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Category</label>
            <select name="category" value={form.category} onChange={handleChange}
              className="border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white
                         hover:border-slate-300 transition-all cursor-pointer">
              {['electronics','books','clothing','furniture','sports','other'].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Condition</label>
            <select name="condition" value={form.condition} onChange={handleChange}
              className="border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white
                         hover:border-slate-300 transition-all cursor-pointer">
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>
        </div>

        {/* Listing type selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Listing Type</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'auction',    label: '⚡ Auction',    desc: 'Real-time bidding' },
              { value: 'fixed',      label: '🏷 Fixed',      desc: 'Set price' },
              { value: 'negotiable', label: '💬 Negotiate',  desc: 'Open to offers' },
            ].map(t => (
              <button key={t.value} type="button"
                onClick={() => setForm(prev => ({ ...prev, listing_type: t.value }))}
                className={`py-3 px-3 rounded-xl border-2 text-left transition-all
                  ${form.listing_type === t.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="text-sm font-semibold text-slate-800">{t.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Starting Price (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
              <input type="number" name="starting_price" value={form.starting_price}
                onChange={handleChange} placeholder="5000"
                className="w-full border-2 border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400
                           hover:border-slate-300 transition-all" />
            </div>
          </div>

          {form.listing_type === 'auction' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Buy Now Price (₹) — optional</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                <input type="number" name="buy_now_price" value={form.buy_now_price}
                  onChange={handleChange} placeholder="10000"
                  className="w-full border-2 border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400
                             hover:border-slate-300 transition-all" />
              </div>
            </div>
          )}
        </div>

        {form.listing_type === 'auction' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Auction End Time <span className="text-red-500">*</span>
            </label>
            <input type="datetime-local" name="auction_end_time"
              value={form.auction_end_time} onChange={handleChange}
              min={minDateTime}
              className="border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400
                         hover:border-slate-300 transition-all" />
          </div>
        )}

        <ErrorMsg message={error} />

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold
                       text-slate-600 hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-indigo-600 text-white font-semibold py-2.5 rounded-xl
                       hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200
                       active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Posting...</>
              : '🚀 Post Listing'
            }
          </button>
        </div>

      </form>
    </div>
  )
}