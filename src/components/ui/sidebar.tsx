import { SpaceShooter } from './game/space-shooter'
import { FileImage } from 'lucide-react'
// import { Separator } from './separator'

export function Sidebar() {
  return (
    <aside className="w-64 border-r-4 border-orange-200 bg-white flex flex-col shadow-xl">
      <div className="p-6 bg-orange-50 border-b-4 border-orange-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-soft flex items-center justify-center shadow-lg border-2 border-orange-600">
            <FileImage className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">
              ImageCrush
            </h1>
            <p className="text-xs font-bold text-orange-soft uppercase tracking-wide">
              Compress • Convert • Conquer
            </p>
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border-2 border-orange-200">
          <p className="text-sm text-gray-700 font-medium">
            Transform your images with <span className="font-bold text-orange-soft">zero compromises</span>. 
            Fast, free, and built for everyone.
          </p>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-orange-soft rounded-full"></div>
            <h2 className="text-sm font-heading font-bold text-gray-900 uppercase tracking-wide">Game Zone</h2>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Blast some aliens while your images convert! 
            <span className="font-semibold text-orange-soft"> High scores welcome.</span>
          </p>
        </div>
        <div className="flex-1 bg-gray-900 min-h-0">
          <SpaceShooter />
        </div>
      </div>
    </aside>
  )
} 