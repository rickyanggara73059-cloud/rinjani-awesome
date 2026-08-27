import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Building2, Mail, MapPin, Phone, Save, Settings as SettingsIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'

type SettingsData = {
  id: number
  business_name: string
  whatsapp: string
  email: string
  address: string
}

function Settings() {
  const [form, setForm] = useState<SettingsData>({
    id: 1,
    business_name: 'Rinjani Awesome',
    whatsapp: '',
    email: '',
    address: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('id, business_name, whatsapp, email, address')
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Gagal memuat settings:', error)
        setLoading(false)
        return
      }

      if (data) {
        setForm({
          id: data.id,
          business_name: data.business_name ?? '',
          whatsapp: data.whatsapp ?? '',
          email: data.email ?? '',
          address: data.address ?? '',
        })
      }

      setLoading(false)
    }

    loadSettings()
  }, [])

  const updateField = (
    key: keyof Omit<SettingsData, 'id'>,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('app_settings')
      .update({
        business_name: form.business_name.trim(),
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', form.id)

    setSaving(false)

    if (error) {
      console.error('Gagal menyimpan settings:', error)
      alert(`Gagal menyimpan settings: ${error.message}`)
      return
    }

    alert('Settings berhasil disimpan.')
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <SettingsIcon size={15} />
            SYSTEM SETTINGS
          </div>

          <h1>Settings</h1>
          <p>Kelola informasi utama Rinjani Awesome.</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h3>Profil Bisnis</h3>
            <p>Informasi yang digunakan sebagai identitas bisnis.</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-grid">
            <label>
              <span>Nama Bisnis</span>
              <div className="input-with-icon">
                <Building2 size={16} />
                <input
                  value={form.business_name}
                  onChange={(event) =>
                    updateField('business_name', event.target.value)
                  }
                  disabled={loading}
                  required
                />
              </div>
            </label>

            <label>
              <span>WhatsApp</span>
              <div className="input-with-icon">
                <Phone size={16} />
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={(event) =>
                    updateField('whatsapp', event.target.value)
                  }
                  disabled={loading}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </label>

            <label>
              <span>Email</span>
              <div className="input-with-icon">
                <Mail size={16} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField('email', event.target.value)
                  }
                  disabled={loading}
                  placeholder="email@domain.com"
                />
              </div>
            </label>

            <label className="form-grid__full">
              <span>Alamat</span>
              <div className="input-with-icon">
                <MapPin size={16} />
                <textarea
                  value={form.address}
                  onChange={(event) =>
                    updateField('address', event.target.value)
                  }
                  disabled={loading}
                  placeholder="Alamat kantor / bisnis"
                  rows={4}
                />
              </div>
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={loading || saving}
            >
              <Save size={16} />
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h3>System Info</h3>
            <p>Informasi sistem CRM saat ini.</p>
          </div>
        </div>

        <div className="customer-summary">
          <div className="customer-summary__item">
            <div className="customer-avatar customer-avatar--gold">
              <SettingsIcon size={16} />
            </div>
            <div>
              <strong>Database</strong>
              <small>Supabase</small>
            </div>
            <strong>Connected</strong>
          </div>

          <div className="customer-summary__item">
            <div className="customer-avatar customer-avatar--blue">
              <Building2 size={16} />
            </div>
            <div>
              <strong>Application</strong>
              <small>Rinjani Awesome CRM</small>
            </div>
            <strong>v1.0.0</strong>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Settings
