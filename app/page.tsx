'use client'

import { useEffect, useRef, useState } from 'react'

export default function FlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [menuOpacity, setMenuOpacity] = useState(1)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isFirstTime, setIsFirstTime] = useState(true)
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
  const [evilSomozaImage, setEvilSomozaImage] = useState<HTMLImageElement | null>(null)

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

    const evilImg = new Image()
    evilImg.src = '/WhatsApp_Image_2025-11-18_at_17.30.22-removebg-preview-2.png'
    evilImg.onload = () => setEvilSomozaImage(evilImg)

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
      // Aplicar blur al fondo solo en el menú
      if (gameState === 'menu') {
        ctx.filter = 'blur(8px)'
      } else {
        ctx.filter = 'none'
      }
      
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height)
      ctx.filter = 'none' // Resetear el filtro después de dibujar el fondo
      
      ctx.fillStyle = 'rgba(135, 206, 235, 0.3)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      if (gameState === 'playing' && countdown === null) {
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

      // Solo mostrar el score cuando está jugando y no hay countdown
      if (gameState === 'playing' && countdown === null) {
        ctx.fillStyle = '#000'
        ctx.font = 'bold 48px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`${gameStateRef.current.score}`, canvas.width / 2, 80)
      }

      if (gameState === 'menu' || menuOpacity > 0) {
        ctx.save()
        ctx.globalAlpha = menuOpacity
        
        // Título "Flappy Alcar" - más arriba
        ctx.fillStyle = '#fff'
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 5
        ctx.font = 'bold 64px Arial'
        ctx.textAlign = 'center'
        ctx.strokeText('Flappy Alcar', canvas.width / 2, 120)
        ctx.fillText('Flappy Alcar', canvas.width / 2, 120)

        // Dibujar el pájaro más grande y centrado en la portada
        const menuBirdSize = 140
        const menuBirdX = canvas.width / 2 - menuBirdSize / 2
        const menuBirdY = canvas.height / 2 - 60
        
        if (birdImage) {
          // Agregar sombra al pájaro para más profundidad
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
          ctx.shadowBlur = 15
          ctx.shadowOffsetX = 5
          ctx.shadowOffsetY = 5
          ctx.drawImage(birdImage, menuBirdX, menuBirdY, menuBirdSize, menuBirdSize)
          ctx.shadowBlur = 0
        }

        // Texto debajo del pájaro "podrás esquivar a los Somoza?"
        ctx.fillStyle = '#fff'
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 3
        ctx.font = 'bold 22px Arial'
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
        ctx.shadowBlur = 10
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
        ctx.strokeText('¿Podrás esquivar a los Somoza?', canvas.width / 2, menuBirdY + menuBirdSize + 50)
        ctx.fillText('¿Podrás esquivar a los Somoza?', canvas.width / 2, menuBirdY + menuBirdSize + 50)
        ctx.shadowBlur = 0 // Resetear sombra

        // Subtítulo "Tap to play" - más abajo
        ctx.fillStyle = '#fff'
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.font = 'bold 26px Arial'
        ctx.strokeText('Tap to play', canvas.width / 2, 520)
        ctx.fillText('Tap to play', canvas.width / 2, 520)

        // Mejor puntaje si existe
        if (bestScore > 0) {
          ctx.fillStyle = '#fff'
          ctx.strokeStyle = '#000'
          ctx.lineWidth = 2
          ctx.font = 'bold 20px Arial'
          ctx.strokeText(`Best: ${bestScore}`, canvas.width / 2, 560)
          ctx.fillText(`Best: ${bestScore}`, canvas.width / 2, 560)
        }
        
        ctx.restore()
      } else {
        // Dibujar el pájaro normal cuando está jugando, en countdown, o en game over
        if (birdImage) {
          ctx.save()
          ctx.drawImage(birdImage, BIRD_X, gameStateRef.current.birdY, BIRD_SIZE, BIRD_SIZE)
          ctx.restore()
        }
      }

      // Dibujar countdown si está activo
      if (countdown !== null) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#fff'
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 6
        ctx.font = 'bold 120px Arial'
        ctx.textAlign = 'center'
        ctx.strokeText(countdown.toString(), canvas.width / 2, canvas.height / 2 + 40)
        ctx.fillText(countdown.toString(), canvas.width / 2, canvas.height / 2 + 40)
      }

      if (gameState === 'gameOver') {
        ctx.fillStyle = 'rgba(139, 0, 0, 0.9)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Dibujar la imagen de Evil Somoza
        if (evilSomozaImage) {
          const imageSize = 250
          const imageX = canvas.width / 2 - imageSize / 2
          const imageY = 100
          ctx.drawImage(evilSomozaImage, imageX, imageY, imageSize, imageSize)
        }
        
        // Texto "Has perdido en manos de Evil Somoza" en rojo y dos líneas
        ctx.fillStyle = '#ff0000'
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 4
        ctx.font = 'bold 28px Arial'
        ctx.textAlign = 'center'
        ctx.strokeText('Has perdido en manos de', canvas.width / 2, 370)
        ctx.fillText('Has perdido en manos de', canvas.width / 2, 370)
        ctx.strokeText('Evil Somoza', canvas.width / 2, 410)
        ctx.fillText('Evil Somoza', canvas.width / 2, 410)
        
        // Score y Best
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 24px Arial'
        ctx.lineWidth = 2
        ctx.strokeText(`Score: ${gameStateRef.current.score}`, canvas.width / 2, 450)
        ctx.fillText(`Score: ${gameStateRef.current.score}`, canvas.width / 2, 450)
        ctx.strokeText(`Best: ${bestScore}`, canvas.width / 2, 490)
        ctx.fillText(`Best: ${bestScore}`, canvas.width / 2, 490)
        
        // Tap to restart
        ctx.font = '18px Arial'
        ctx.strokeText('Tap to restart', canvas.width / 2, 530)
        ctx.fillText('Tap to restart', canvas.width / 2, 530)
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [gameState, birdImage, pipeImage, backgroundImage, evilSomozaImage, bestScore, menuOpacity, countdown])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleFlap = () => {
      if (gameState === 'menu') {
        // Animación de fade out suave antes de iniciar el juego
        const fadeDuration = 400 // 400ms para la transición
        const startTime = Date.now()
        const startOpacity = menuOpacity
        
        const fadeOut = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / fadeDuration, 1)
          const newOpacity = startOpacity * (1 - progress)
          
          setMenuOpacity(newOpacity)
          
          if (progress < 1) {
            requestAnimationFrame(fadeOut)
          } else {
            setMenuOpacity(0)
            // Si es la primera vez, iniciar countdown
            if (isFirstTime) {
              setCountdown(3)
            } else {
              // Si no es la primera vez, iniciar el juego directamente
              setGameState('playing')
              gameStateRef.current.isPlaying = true
              gameStateRef.current.birdVelocity = 0
            }
          }
        }
        fadeOut()
      } else if (gameState === 'playing') {
        gameStateRef.current.birdVelocity = -9
      } else if (gameState === 'gameOver') {
        // Reiniciar el juego directamente sin volver al menú
        gameStateRef.current.birdY = 200
        gameStateRef.current.birdVelocity = 0
        gameStateRef.current.pipes = []
        gameStateRef.current.score = 0
        setScore(0)
        setGameState('playing')
        gameStateRef.current.isPlaying = true
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
  }, [gameState, menuOpacity, isFirstTime])

  // Manejar el countdown
  useEffect(() => {
    if (countdown === null) return

    if (countdown === 0) {
      // Cuando el countdown llega a 0, iniciar el juego
      setCountdown(null)
      setIsFirstTime(false)
      setGameState('playing')
      gameStateRef.current.isPlaying = true
      gameStateRef.current.birdVelocity = 0
      return
    }

    // Esperar 1 segundo antes de reducir el countdown
    const timer = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown])

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="border-4 border-white shadow-2xl cursor-pointer bg-blue-200"
        />
      </div>
    </main>
  )
}
