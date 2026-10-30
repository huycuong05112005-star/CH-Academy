import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface CyberOrb3DProps {
  size?: number
  className?: string
  glowColor?: string
}

export const CyberOrb3D: React.FC<CyberOrb3DProps> = ({
  size = 90,
  className = ''
}) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false
    if (prefersReducedMotion) {
      setFailed(true)
      return
    }

    const container = mountRef.current
    if (!container) return

    let renderer: THREE.WebGLRenderer | null = null
    let animId: number | null = null

    try {
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
      camera.position.z = 7

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(size, size)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      container.appendChild(renderer.domElement)

      // Light
      const ambientLight = new THREE.AmbientLight(0x38bdf8, 1.5)
      scene.add(ambientLight)

      // Core wireframe sphere
      const sphereGeo = new THREE.SphereGeometry(2.2, 16, 12)
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.6,
        wireframe: true,
        transparent: true,
        opacity: 0.85
      })
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat)
      scene.add(sphereMesh)

      // Outer Ring
      const ringGeo = new THREE.TorusGeometry(3.1, 0.04, 8, 48)
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.rotation.x = Math.PI / 3
      scene.add(ringMesh)

      const startTime = performance.now()
      const animate = () => {
        animId = requestAnimationFrame(animate)
        const t = (performance.now() - startTime) * 0.001
        sphereMesh.rotation.y = t * 0.4
        sphereMesh.rotation.x = t * 0.2
        ringMesh.rotation.z = -t * 0.5
        renderer?.render(scene, camera)
      }
      animate()

      return () => {
        if (animId) cancelAnimationFrame(animId)
        sphereGeo.dispose()
        sphereMat.dispose()
        ringGeo.dispose()
        ringMat.dispose()
        if (renderer) {
          renderer.dispose()
          if (renderer.domElement && container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement)
          }
        }
      }
    } catch {
      setFailed(true)
    }
  }, [size])

  if (failed) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 flex items-center justify-center ${className}`}
      >
        <div className="w-1/2 h-1/2 rounded-full border-2 border-cyan-400/50 animate-pulse" />
      </div>
    )
  }

  return (
    <div
      ref={mountRef}
      style={{ width: size, height: size }}
      aria-hidden="true"
      className={`pointer-events-none select-none relative inline-block ${className}`}
    />
  )
}
