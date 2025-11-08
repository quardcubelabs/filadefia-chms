'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Button, Card, CardBody, Badge, Alert } from '@/components/ui';
import { Palette, Copy, Check } from 'lucide-react';

export default function ColorsPage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const ColorSwatch = ({ color, name, hex }: { color: string; name: string; hex: string }) => (
    <div 
      className="group relative cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
      onClick={() => copyToClipboard(hex)}
    >
      <div className={`h-24 ${color}`}></div>
      <div className="p-3 bg-white">
        <p className="text-sm font-semibold text-tag-gray-900">{name}</p>
        <p className="text-xs text-tag-gray-600 font-mono">{hex}</p>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {copiedColor === hex ? (
            <Check className="h-5 w-5 text-white bg-green-500 rounded-full p-1" />
          ) : (
            <Copy className="h-5 w-5 text-white bg-tag-black bg-opacity-50 rounded-full p-1" />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-tag-gray-50">
      <Sidebar />
      
      <main className="ml-20 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-tag-black flex items-center">
            <Palette className="h-10 w-10 mr-4 text-tag-red-500" />
            TAG Color System
          </h1>
          <p className="text-tag-gray-600 mt-2">Official Tanzania Assemblies of God color palette</p>
        </div>

        {/* Color Showcase */}
        <div className="space-y-8">
          {/* TAG Red */}
          <Card variant="default">
            <CardBody className="p-6">
              <h2 className="text-2xl font-bold text-tag-red-600 mb-4">🔴 TAG Red (Primary)</h2>
              <p className="text-tag-gray-600 mb-6">Primary brand color from the TAG logo</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <ColorSwatch color="bg-tag-red-50" name="tag-red-50" hex="#fef2f2" />
                <ColorSwatch color="bg-tag-red-100" name="tag-red-100" hex="#fee2e2" />
                <ColorSwatch color="bg-tag-red-300" name="tag-red-300" hex="#fca5a5" />
                <ColorSwatch color="bg-tag-red-500" name="tag-red-500 ⭐" hex="#e31e24" />
                <ColorSwatch color="bg-tag-red-700" name="tag-red-700" hex="#b91c1c" />
                <ColorSwatch color="bg-tag-red-900" name="tag-red-900" hex="#7f1d1d" />
              </div>
            </CardBody>
          </Card>

          {/* TAG Yellow/Gold */}
          <Card variant="default">
            <CardBody className="p-6">
              <h2 className="text-2xl font-bold text-tag-yellow-600 mb-4">💛 TAG Yellow/Gold (Secondary)</h2>
              <p className="text-tag-gray-600 mb-6">Secondary brand color from the TAG logo</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <ColorSwatch color="bg-tag-yellow-50" name="tag-yellow-50" hex="#fefce8" />
                <ColorSwatch color="bg-tag-yellow-100" name="tag-yellow-100" hex="#fef9c3" />
                <ColorSwatch color="bg-tag-yellow-300" name="tag-yellow-300" hex="#fde047" />
                <ColorSwatch color="bg-tag-yellow-500" name="tag-yellow-500 ⭐" hex="#ffd700" />
                <ColorSwatch color="bg-tag-yellow-700" name="tag-yellow-700" hex="#ca8a04" />
                <ColorSwatch color="bg-tag-yellow-900" name="tag-yellow-900" hex="#854d0e" />
              </div>
            </CardBody>
          </Card>

          {/* TAG Blue */}
          <Card variant="default">
            <CardBody className="p-6">
              <h2 className="text-2xl font-bold text-tag-blue-700 mb-4">🔵 Dark Blue (Supporting)</h2>
              <p className="text-tag-gray-600 mb-6">Supporting color for links, info states, and accents</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <ColorSwatch color="bg-tag-blue-50" name="tag-blue-50" hex="#eff6ff" />
                <ColorSwatch color="bg-tag-blue-100" name="tag-blue-100" hex="#dbeafe" />
                <ColorSwatch color="bg-tag-blue-500" name="tag-blue-500" hex="#3b82f6" />
                <ColorSwatch color="bg-tag-blue-700" name="tag-blue-700 ⭐" hex="#1d4ed8" />
                <ColorSwatch color="bg-tag-blue-900" name="tag-blue-900 ⭐" hex="#1e3a8a" />
                <ColorSwatch color="bg-tag-blue-950" name="tag-blue-950" hex="#0f172a" />
              </div>
            </CardBody>
          </Card>

          {/* TAG Gray */}
          <Card variant="default">
            <CardBody className="p-6">
              <h2 className="text-2xl font-bold text-tag-gray-700 mb-4">⚫ Neutral Grays</h2>
              <p className="text-tag-gray-600 mb-6">UI neutrals for backgrounds, text, and borders</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <ColorSwatch color="bg-tag-gray-50" name="tag-gray-50" hex="#f9fafb" />
                <ColorSwatch color="bg-tag-gray-100" name="tag-gray-100" hex="#f3f4f6" />
                <ColorSwatch color="bg-tag-gray-300" name="tag-gray-300" hex="#d1d5db" />
                <ColorSwatch color="bg-tag-gray-500" name="tag-gray-500" hex="#6b7280" />
                <ColorSwatch color="bg-tag-gray-700" name="tag-gray-700" hex="#374151" />
                <ColorSwatch color="bg-tag-gray-900" name="tag-gray-900" hex="#111827" />
              </div>
            </CardBody>
          </Card>

          {/* Component Examples */}
          <Card variant="default">
            <CardBody className="p-6">
              <h2 className="text-2xl font-bold text-tag-black mb-6">Component Examples</h2>
              
              {/* Buttons */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-tag-gray-900 mb-4">Buttons</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary">TAG Red Primary</Button>
                  <Button variant="secondary">TAG Yellow Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="success">Success</Button>
                </div>
              </div>

              {/* Badges */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-tag-gray-900 mb-4">Badges</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="default">Default</Badge>
                  <Badge variant="primary">Primary</Badge>
                </div>
              </div>

              {/* Alerts */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-tag-gray-900 mb-4">Alerts</h3>
                <Alert variant="error" title="Error Alert">
                  This is an error alert using TAG red color.
                </Alert>
                <Alert variant="warning" title="Warning Alert">
                  This is a warning alert using TAG yellow color.
                </Alert>
                <Alert variant="info" title="Info Alert">
                  This is an info alert using TAG blue color.
                </Alert>
                <Alert variant="success" title="Success Alert">
                  This is a success alert with green color.
                </Alert>
              </div>
            </CardBody>
          </Card>

          {/* Gradients */}
          <Card variant="default">
            <CardBody className="p-6">
              <h2 className="text-2xl font-bold text-tag-black mb-6">TAG Gradients</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-32 rounded-xl bg-gradient-to-r from-tag-red-500 to-tag-red-700 flex items-center justify-center">
                  <p className="text-white font-bold text-lg">TAG Red Gradient</p>
                </div>
                <div className="h-32 rounded-xl bg-gradient-to-r from-tag-yellow-500 to-tag-yellow-600 flex items-center justify-center">
                  <p className="text-tag-black font-bold text-lg">TAG Yellow Gradient</p>
                </div>
                <div className="h-32 rounded-xl bg-gradient-to-r from-tag-blue-700 to-tag-blue-900 flex items-center justify-center">
                  <p className="text-white font-bold text-lg">TAG Blue Gradient</p>
                </div>
                <div className="h-32 rounded-xl bg-gradient-to-r from-tag-red-500 via-tag-yellow-500 to-tag-blue-700 flex items-center justify-center">
                  <p className="text-white font-bold text-lg drop-shadow-lg">Full TAG Spectrum</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Usage Guide */}
          <Card variant="default">
            <CardBody className="p-6 bg-tag-gray-50">
              <h2 className="text-2xl font-bold text-tag-black mb-4">💡 Quick Usage Guide</h2>
              <div className="space-y-3 text-tag-gray-700">
                <p><strong className="text-tag-red-600">TAG Red:</strong> Primary buttons, headers, important alerts, branding</p>
                <p><strong className="text-tag-yellow-600">TAG Yellow/Gold:</strong> Secondary buttons, highlights, success states, accents</p>
                <p><strong className="text-tag-blue-700">Dark Blue:</strong> Links, info states, secondary elements</p>
                <p><strong className="text-tag-black">Black & White:</strong> Text, backgrounds, high contrast elements</p>
                <p><strong className="text-tag-gray-600">Gray Scale:</strong> UI neutrals, borders, disabled states</p>
              </div>
              <div className="mt-6 p-4 bg-white rounded-lg border-l-4 border-tag-red-500">
                <p className="text-sm text-tag-gray-700">
                  <strong>Tip:</strong> Click any color swatch to copy its hex code to clipboard!
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
}
