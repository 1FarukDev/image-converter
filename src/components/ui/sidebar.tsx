import { SpaceShooter } from './game/space-shooter'
import { FileImage } from 'lucide-react'
// import { Separator } from './separator'

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
            <FileImage className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">
              Multi Formater
            </h1>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Fast & free image converter for all your needs
        </p>
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-blue-50/50 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900 mb-1">While You Wait...</h2>
          <p className="text-xs text-gray-600">
            Enjoy a quick space shooter game during conversion! Defend against incoming enemies and aim for a high score.
          </p>
        </div>
        <div className="flex-1">
          <SpaceShooter />
        </div>
      </div>
    </aside>
  )
} 