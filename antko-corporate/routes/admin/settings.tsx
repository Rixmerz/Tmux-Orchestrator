import { Handlers, PageProps } from "$fresh/server.ts";
import { CRMLayout } from "../../components/CRMLayout.tsx";
import { FormInput } from "../../components/forms/FormInput.tsx";
import { FormSelect } from "../../components/forms/FormSelect.tsx";
import { Button } from "../../components/Button.tsx";

interface Data {
  isAuthenticated: boolean;
}

export const handler: Handlers<Data> = {
  GET(req, ctx) {
    const cookies = req.headers.get("Cookie") || "";
    const isAuthenticated = cookies.includes("auth=authenticated");
    
    if (!isAuthenticated) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/admin" }
      });
    }
    
    return ctx.render({ isAuthenticated });
  }
};

export default function SettingsPage({ data }: PageProps<Data>) {
  const settingsSections = [
    {
      id: "general",
      title: "General Settings",
      description: "Basic CRM configuration and preferences",
      icon: "⚙️"
    },
    {
      id: "security",
      title: "Security & Authentication",
      description: "User authentication and security policies",
      icon: "🔒"
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Email and system notification preferences",
      icon: "📧"
    },
    {
      id: "integration",
      title: "Integrations",
      description: "Third-party system integrations and APIs",
      icon: "🔗"
    },
    {
      id: "data",
      title: "Data Management",
      description: "Backup, export, and data retention policies",
      icon: "💾"
    },
    {
      id: "customization",
      title: "Customization",
      description: "Custom fields, pipelines, and workflows",
      icon: "🎨"
    }
  ];

  const timezoneOptions = [
    { value: "America/Puerto_Rico", label: "Puerto Rico Time (AST)" },
    { value: "America/New_York", label: "Eastern Time (EST/EDT)" },
    { value: "America/Chicago", label: "Central Time (CST/CDT)" },
    { value: "America/Denver", label: "Mountain Time (MST/MDT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PST/PDT)" }
  ];

  const currencyOptions = [
    { value: "USD", label: "US Dollar ($)" },
    { value: "EUR", label: "Euro (€)" },
    { value: "GBP", label: "British Pound (£)" },
    { value: "CAD", label: "Canadian Dollar (C$)" }
  ];

  const languageOptions = [
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
    { value: "fr", label: "Français" },
    { value: "pt", label: "Português" }
  ];

  return (
    <CRMLayout 
      title="Settings - ANTKO Corporate" 
      currentPath="/admin/settings"
      userRole="admin"
      userName="Admin User"
    >
      <div>
        <div class="mb-8">
          <h1 class="text-3xl font-bold font-display text-slate-900 mb-2">
            System Settings
          </h1>
          <p class="text-lg text-slate-600">
            Configure CRM system settings and preferences
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Navigation */}
          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h3 class="text-lg font-semibold text-slate-900 mb-4">Settings Categories</h3>
              <nav class="space-y-2">
                {settingsSections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <span class="text-lg">{section.icon}</span>
                    <div>
                      <div class="font-medium">{section.title}</div>
                      <div class="text-xs text-slate-500">{section.description}</div>
                    </div>
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div class="lg:col-span-2 space-y-8">
            {/* General Settings */}
            <div id="general" class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex items-center space-x-3 mb-6">
                <span class="text-2xl">⚙️</span>
                <div>
                  <h3 class="text-lg font-semibold text-slate-900">General Settings</h3>
                  <p class="text-sm text-slate-600">Basic CRM configuration and preferences</p>
                </div>
              </div>

              <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    name="company_name"
                    label="Company Name"
                    value="ANTKO Corporate"
                    placeholder="Enter company name"
                  />
                  <FormInput
                    name="company_website"
                    label="Company Website"
                    type="url"
                    value="https://antko.com"
                    placeholder="https://example.com"
                  />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormSelect
                    name="timezone"
                    label="Default Timezone"
                    value="America/Puerto_Rico"
                    options={timezoneOptions}
                  />
                  <FormSelect
                    name="currency"
                    label="Default Currency"
                    value="USD"
                    options={currencyOptions}
                  />
                </div>

                <FormSelect
                  name="language"
                  label="Default Language"
                  value="en"
                  options={languageOptions}
                />

                <div class="flex justify-end">
                  <Button variant="primary">Save General Settings</Button>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div id="security" class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex items-center space-x-3 mb-6">
                <span class="text-2xl">🔒</span>
                <div>
                  <h3 class="text-lg font-semibold text-slate-900">Security & Authentication</h3>
                  <p class="text-sm text-slate-600">User authentication and security policies</p>
                </div>
              </div>

              <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    name="session_timeout"
                    label="Session Timeout (minutes)"
                    type="number"
                    value="60"
                    placeholder="60"
                  />
                  <FormInput
                    name="password_expiry"
                    label="Password Expiry (days)"
                    type="number"
                    value="90"
                    placeholder="90"
                  />
                </div>

                <div class="space-y-4">
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      id="two_factor"
                      class="h-4 w-4 text-antko-blue-600 focus:ring-antko-blue-500 border-slate-300 rounded"
                      checked
                    />
                    <label htmlFor="two_factor" class="ml-2 text-sm text-slate-700">
                      Enable Two-Factor Authentication
                    </label>
                  </div>

                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      id="force_https"
                      class="h-4 w-4 text-antko-blue-600 focus:ring-antko-blue-500 border-slate-300 rounded"
                      checked
                    />
                    <label htmlFor="force_https" class="ml-2 text-sm text-slate-700">
                      Force HTTPS for all connections
                    </label>
                  </div>

                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      id="audit_logs"
                      class="h-4 w-4 text-antko-blue-600 focus:ring-antko-blue-500 border-slate-300 rounded"
                      checked
                    />
                    <label htmlFor="audit_logs" class="ml-2 text-sm text-slate-700">
                      Enable audit logging
                    </label>
                  </div>
                </div>

                <div class="flex justify-end">
                  <Button variant="primary">Save Security Settings</Button>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div id="notifications" class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex items-center space-x-3 mb-6">
                <span class="text-2xl">📧</span>
                <div>
                  <h3 class="text-lg font-semibold text-slate-900">Notifications</h3>
                  <p class="text-sm text-slate-600">Email and system notification preferences</p>
                </div>
              </div>

              <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    name="smtp_server"
                    label="SMTP Server"
                    value="smtp.gmail.com"
                    placeholder="smtp.gmail.com"
                  />
                  <FormInput
                    name="smtp_port"
                    label="SMTP Port"
                    type="number"
                    value="587"
                    placeholder="587"
                  />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    name="from_email"
                    label="From Email"
                    type="email"
                    value="noreply@antko.com"
                    placeholder="noreply@company.com"
                  />
                  <FormInput
                    name="from_name"
                    label="From Name"
                    value="ANTKO CRM"
                    placeholder="Company Name"
                  />
                </div>

                <div class="space-y-4">
                  <h4 class="font-medium text-slate-900">Email Notifications</h4>
                  <div class="space-y-3">
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        id="new_leads"
                        class="h-4 w-4 text-antko-blue-600 focus:ring-antko-blue-500 border-slate-300 rounded"
                        checked
                      />
                      <label htmlFor="new_leads" class="ml-2 text-sm text-slate-700">
                        New lead notifications
                      </label>
                    </div>
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        id="deal_updates"
                        class="h-4 w-4 text-antko-blue-600 focus:ring-antko-blue-500 border-slate-300 rounded"
                        checked
                      />
                      <label htmlFor="deal_updates" class="ml-2 text-sm text-slate-700">
                        Deal stage updates
                      </label>
                    </div>
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        id="task_reminders"
                        class="h-4 w-4 text-antko-blue-600 focus:ring-antko-blue-500 border-slate-300 rounded"
                        checked
                      />
                      <label htmlFor="task_reminders" class="ml-2 text-sm text-slate-700">
                        Task reminders
                      </label>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end">
                  <Button variant="primary">Save Notification Settings</Button>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex items-center space-x-3 mb-6">
                <span class="text-2xl">ℹ️</span>
                <div>
                  <h3 class="text-lg font-semibold text-slate-900">System Information</h3>
                  <p class="text-sm text-slate-600">Current system status and version information</p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                  <div class="flex justify-between">
                    <span class="text-sm text-slate-600">CRM Version:</span>
                    <span class="text-sm font-medium text-slate-900">1.0.0</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm text-slate-600">Database:</span>
                    <span class="text-sm font-medium text-slate-900">PostgreSQL 15.2</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm text-slate-600">Server:</span>
                    <span class="text-sm font-medium text-slate-900">Deno Fresh</span>
                  </div>
                </div>
                <div class="space-y-4">
                  <div class="flex justify-between">
                    <span class="text-sm text-slate-600">Last Backup:</span>
                    <span class="text-sm font-medium text-slate-900">2 hours ago</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm text-slate-600">Uptime:</span>
                    <span class="text-sm font-medium text-slate-900">7 days, 3 hours</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm text-slate-600">Storage Used:</span>
                    <span class="text-sm font-medium text-slate-900">2.3 GB / 100 GB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CRMLayout>
  );
}