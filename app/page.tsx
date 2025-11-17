'use client'

import { useEffect, useRef, useState } from 'react'

export default function FlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const gameStateRef = useRef({
    birdY: 200,
    birdVelocity: 0,
    pipes: [] as Array<{ x: number; gapY: number; scored: boolean }>,
    score: 0,
    isPlaying: false,
  })

  const [birdImage, setBirdImage] = useState<HTMLImageElement | null>(null)
  const [pipeImage, setPipeImage] = useState<HTMLImageElement | null>(null)
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    const birdImg = new Image()
    birdImg.crossOrigin = 'anonymous'
    birdImg.src =
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hector-Alcar_Mesa-de-trabajo-1-removebg-preview__1_-removebg-preview-F4dG9PzDBUpTb1nHi5tiqGqt4CwxpV.png'
    birdImg.onload = () => setBirdImage(birdImg)

    const pipeImg = new Image()
    pipeImg.crossOrigin = 'anonymous'
    pipeImg.src =
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1606843694338-removebg-preview-BUcFwIFFlnq8xJ6qcdPPAgkTPZacpk.png'
    pipeImg.onload = () => setPipeImage(pipeImg)

    const bgImg = new Image()
    bgImg.crossOrigin = 'anonymous'
    bgImg.src = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1693788394090-rHm5nTXC09cix6HesGvQZzbqObvV3J.jpeg'
    bgImg.onload = () => setBackgroundImage(bgImg)

    let lastBestScore = localStorage.getItem('flappyBestScore')
    if (lastBestScore) setBestScore(parseInt(lastBestScore))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !birdImage || !pipeImage || !backgroundImage) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const GRAVITY = 0.5
    const FLAP_STRENGTH = -9
    const PIPE_WIDTH = 80
    const PIPE_GAP = 140
    const PIPE_SPEED = 4
    const PIPE_SPAWN_RATE = 110
    const BIRD_SIZE = 40
    const BIRD_X = 60

    let frameCount = 0
    let pipeSpawnCounter = 0
    let animationId: number

    const drawTiledImage = (img: HTMLImageElement, x: number, y: number, width: number, height: number) => {
      const tileSize = 50
      for (let i = 0; i < width; i += tileSize) {
        for (let j = 0; j < height; j += tileSize) {
          const drawWidth = Math.min(tileSize, width - i)
          const drawHeight = Math.min(tileSize, height - j)
          ctx.drawImage(img, 0, 0, img.width, img.height, x + i, y + j, drawWidth, drawHeight)
        }
      }
    }

    const animate = () => {
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(135, 206, 235, 0.3)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      if (gameState === 'playing') {
        gameStateRef.current.birdVelocity += GRAVITY
        gameStateRef.current.birdY += gameStateRef.current.birdVelocity

        pipeSpawnCounter++
        if (pipeSpawnCounter > PIPE_SPAWN_RATE) {
          const minGapY = 60
          const maxGapY = canvas.height - PIPE_GAP - 60
          const gapY = Math.random() * (maxGapY - minGapY) + minGapY
          gameStateRef.current.pipes.push({ x: canvas.width, gapY, scored: false })
          pipeSpawnCounter = 0
        }

        gameStateRef.current.pipes = gameStateRef.current.pipes.filter((pipe) => {
          pipe.x -= PIPE_SPEED

          drawTiledImage(pipeImage, pipe.x, 0, PIPE_WIDTH, pipe.gapY)
          drawTiledImage(pipeImage, pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, canvas.height - pipe.gapY - PIPE_GAP)

          const birdRight = BIRD_X + BIRD_SIZE
          const birdBottom = gameStateRef.current.birdY + BIRD_SIZE

          if (birdRight > pipe.x && BIRD_X < pipe.x + PIPE_WIDTH) {
            if (
              gameStateRef.current.birdY < pipe.gapY ||
              birdBottom > pipe.gapY + PIPE_GAP
            ) {
              setGameState('gameOver')
              const newBest = Math.max(bestScore, gameStateRef.current.score)
              setBestScore(newBest)
              localStorage.setItem('flappyBestScore', newBest.toString())
            }
          }

          if (!pipe.scored && pipe.x + PIPE_WIDTH < BIRD_X && gameState === 'playing') {
            pipe.scored = true
            gameStateRef.current.score++
            setScore(gameStateRef.current.score)
          }

          return pipe.x > -PIPE_WIDTH
        })

        if (gameStateRef.current.birdY + BIRD_SIZE >= canvas.height || gameStateRef.current.birdY <= 0) {
          setGameState('gameOver')
          const newBest = Math.max(bestScore, gameStateRef.current.score)
          setBestScore(newBest)
          localStorage.setItem('flappyBestScore', newBest.toString())
        }
      }

      ctx.save()
      ctx.drawImage(birdImage, BIRD_X, gameStateRef.current.birdY, BIRD_SIZE, BIRD_SIZE)
      ctx.restore()

      ctx.fillStyle = '#000'
      ctx.font = 'bold 48px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`${gameStateRef.current.score}`, canvas.width / 2, 80)

      if (gameState === 'menu') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.fillRect(50, 150, 300, 200)
        ctx.fillStyle = '#000'
        ctx.font = 'bold 40px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Flappy Bird', canvas.width / 2, 210)
        ctx.font = '18px Arial'
        ctx.fillText('Tap to play', canvas.width / 2, 280)
        if (bestScore > 0) {
          ctx.font = '16px Arial'
          ctx.fillText(`Best: ${bestScore}`, canvas.width / 2, 320)
        }
      }

      if (gameState === 'gameOver') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 40px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Game Over', canvas.width / 2, 200)
        ctx.font = '24px Arial'
        ctx.fillText(`Score: ${gameStateRef.current.score}`, canvas.width / 2, 260)
        ctx.fillText(`Best: ${bestScore}`, canvas.width / 2, 310)
        ctx.font = '18px Arial'
        ctx.fillText('Tap to restart', canvas.width / 2, 370)
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [gameState, birdImage, pipeImage, backgroundImage, bestScore])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleFlap = () => {
      if (gameState === 'menu') {
        setGameState('playing')
        gameStateRef.current.isPlaying = true
        gameStateRef.current.birdVelocity = 0
      } else if (gameState === 'playing') {
        gameStateRef.current.birdVelocity = -9
      } else if (gameState === 'gameOver') {
        gameStateRef.current.birdY = 200
        gameStateRef.current.birdVelocity = 0
        gameStateRef.current.pipes = []
        gameStateRef.current.score = 0
        setScore(0)
        setGameState('menu')
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        handleFlap()
      }
    }

    canvas.addEventListener('click', handleFlap)
    window.addEventListener('keydown', handleKeyDown)
    canvas.addEventListener('touchstart', handleFlap)

    return () => {
      canvas.removeEventListener('click', handleFlap)
      window.removeEventListener('keydown', handleKeyDown)
      canvas.removeEventListener('touchstart', handleFlap)
    }
  }, [gameState])

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Texto arriba */}
          <p className="absolute -top-8 left-1/2 -translate-x-1/2 text-white text-sm font-semibold whitespace-nowrap">
            faure se copió con chatGPT
          </p>
          
          <div className="flex items-center gap-4">
            {/* Texto izquierda */}
            <p className="text-white text-sm font-semibold whitespace-nowrap">
              A marosek le gustan maduros
            </p>
            
            {/* Canvas del juego */}
            <canvas
              ref={canvasRef}
              width={400}
              height={600}
              className="border-4 border-white shadow-2xl cursor-pointer bg-blue-200"
            />
            
            {/* Texto derecha */}
            <p className="text-white text-sm font-semibold whitespace-nowrap">
              Iñaki te vendiste, ya no sos amigo
            </p>
          </div>
          
          {/* Texto abajo */}
          <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white text-sm font-semibold whitespace-nowrap">
            santi viñas compadre, hector alcar es tu padre
          </p>
        </div>
      </div>
    </main>
  )
}
