import { useEffect, useRef, useState } from 'react'
import { Button } from '../button'
import { Rocket, Pause, Play, RefreshCw } from 'lucide-react'

interface GameObject {
  x: number
  y: number
  width: number
  height: number
  speed: number
}

interface Player extends GameObject {
  lives: number
  score: number
}

interface Enemy extends GameObject {
  active: boolean
}

interface Bullet extends GameObject {
  active: boolean
}

export function SpaceShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameOver, setGameOver] = useState(false)
  
  const gameStateRef = useRef({
    player: {
      x: 0,
      y: 0,
      width: 20,
      height: 30,
      speed: 8,
      lives: 3,
      score: 0
    } as Player,
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    lastEnemySpawn: 0,
    enemySpawnInterval: 2000,
  })

  useEffect(() => {
    if (!canvasRef.current || !gameStarted || isPaused || gameOver) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    // Initialize player position
    gameStateRef.current.player.x = canvas.width / 2 - gameStateRef.current.player.width / 2
    gameStateRef.current.player.y = canvas.height - 50

    const spawnEnemy = () => {
      const now = Date.now()
      if (now - gameStateRef.current.lastEnemySpawn > gameStateRef.current.enemySpawnInterval) {
        const enemy: Enemy = {
          x: Math.random() * (canvas.width - 20),
          y: -20,
          width: 20,
          height: 20,
          speed: 2,
          active: true
        }
        gameStateRef.current.enemies.push(enemy)
        gameStateRef.current.lastEnemySpawn = now
      }
    }

    const shoot = () => {
      const bullet: Bullet = {
        x: gameStateRef.current.player.x + gameStateRef.current.player.width / 2 - 2,
        y: gameStateRef.current.player.y,
        width: 4,
        height: 10,
        speed: 7,
        active: true
      }
      gameStateRef.current.bullets.push(bullet)
    }

    const checkCollisions = () => {
      const { bullets, enemies, player } = gameStateRef.current

      // Bullet-enemy collisions
      bullets.forEach(bullet => {
        if (!bullet.active) return
        enemies.forEach(enemy => {
          if (!enemy.active) return
          if (
            bullet.x < enemy.x + enemy.width &&
            bullet.x + bullet.width > enemy.x &&
            bullet.y < enemy.y + enemy.height &&
            bullet.y + bullet.height > enemy.y
          ) {
            bullet.active = false
            enemy.active = false
            player.score += 10
            setScore(player.score)
          }
        })
      })

      // Player-enemy collisions
      enemies.forEach(enemy => {
        if (!enemy.active) return
        if (
          player.x < enemy.x + enemy.width &&
          player.x + player.width > enemy.x &&
          player.y < enemy.y + enemy.height &&
          player.y + player.height > enemy.y
        ) {
          enemy.active = false
          player.lives--
          setLives(player.lives)
          if (player.lives <= 0) {
            setGameOver(true)
          }
        }
      })
    }

    const update = () => {
      // Update bullets
      gameStateRef.current.bullets.forEach(bullet => {
        if (bullet.active) {
          bullet.y -= bullet.speed
          if (bullet.y < 0) bullet.active = false
        }
      })

      // Update enemies
      gameStateRef.current.enemies.forEach(enemy => {
        if (enemy.active) {
          enemy.y += enemy.speed
          if (enemy.y > canvas.height) {
            enemy.active = false
            gameStateRef.current.player.lives--
            setLives(gameStateRef.current.player.lives)
            if (gameStateRef.current.player.lives <= 0) {
              setGameOver(true)
            }
          }
        }
      })

      // Clean up inactive objects
      gameStateRef.current.bullets = gameStateRef.current.bullets.filter(bullet => bullet.active)
      gameStateRef.current.enemies = gameStateRef.current.enemies.filter(enemy => enemy.active)

      spawnEnemy()
      checkCollisions()
    }

    const draw = () => {
      ctx.fillStyle = '#f8fafc' // Matches the app's background
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw player
      ctx.fillStyle = '#3b82f6' // Blue to match the app's theme
      ctx.fillRect(
        gameStateRef.current.player.x,
        gameStateRef.current.player.y,
        gameStateRef.current.player.width,
        gameStateRef.current.player.height
      )

      // Draw bullets
      ctx.fillStyle = '#2563eb'
      gameStateRef.current.bullets.forEach(bullet => {
        if (bullet.active) {
          ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
        }
      })

      // Draw enemies
      ctx.fillStyle = '#ef4444'
      gameStateRef.current.enemies.forEach(enemy => {
        if (enemy.active) {
          ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height)
        }
      })
    }

    const gameLoop = () => {
      update()
      draw()
      animationFrameId = requestAnimationFrame(gameLoop)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const player = gameStateRef.current.player
      const moveDistance = e.shiftKey ? player.speed * 1.5 : player.speed
      
      switch (e.key) {
        case 'ArrowLeft':
          player.x = Math.max(0, player.x - moveDistance)
          break
        case 'ArrowRight':
          player.x = Math.min(canvas.width - player.width, player.x + moveDistance)
          break
        case ' ':
          shoot()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    animationFrameId = requestAnimationFrame(gameLoop)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      cancelAnimationFrame(animationFrameId)
    }
  }, [gameStarted, isPaused, gameOver])

  const handleRestart = () => {
    gameStateRef.current = {
      player: {
        x: 0,
        y: 0,
        width: 20,
        height: 30,
        speed: 8,
        lives: 3,
        score: 0
      },
      enemies: [],
      bullets: [],
      lastEnemySpawn: 0,
      enemySpawnInterval: 2000,
    }
    setScore(0)
    setLives(3)
    setGameOver(false)
    setGameStarted(true)
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-blue-600" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Score: {score}</span>
                <span className="text-sm font-medium">Lives: {lives}</span>
              </div>
            </div>
          </div>
          {gameStarted && !gameOver && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPaused(!isPaused)}
              className="h-7 w-7"
            >
              {isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          width={220}
          height={400}
          className="absolute inset-0"
        />
        
        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80">
            <div className="text-center">
              {gameOver && (
                <>
                  <h3 className="text-lg font-bold mb-1">Game Over!</h3>
                  <p className="text-sm text-gray-600 mb-3">Final Score: {score}</p>
                </>
              )}
              <Button
                onClick={handleRestart}
                className="flex items-center gap-2"
                size="sm"
              >
                {gameOver ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Play Again
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Game
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          ← → Move • Hold Shift to Boost • Space to shoot
        </div>
      </div>
    </div>
  )
} 