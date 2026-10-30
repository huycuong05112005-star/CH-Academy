import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface KnowledgeMatrix3DProps {
  className?: string
  interactive?: boolean
  density?: 'compact' | 'normal' | 'rich'
}

export const KnowledgeMatrix3D: React.FC<KnowledgeMatrix3DProps> = ({
  className = '',
  interactive = true,
  density = 'normal'
}) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const [webGLFailed, setWebGLFailed] = useState(false)

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false
    if (prefersReducedMotion) {
      setWebGLFailed(true)
      return
    }

    const container = mountRef.current
    if (!container) return

    let renderer: THREE.WebGLRenderer | null = null
    let animId: number | null = null

    try {
      const width = container.clientWidth || 400
      const height = container.clientHeight || 400

      // Scene & Camera
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
      camera.position.z = 24

      // WebGL Renderer
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      container.appendChild(renderer.domElement)

      // Lights
      const ambientLight = new THREE.AmbientLight(0x0ea5e9, 1.2)
      scene.add(ambientLight)

      const pointLight1 = new THREE.PointLight(0x38bdf8, 3, 50)
      pointLight1.position.set(10, 10, 10)
      scene.add(pointLight1)

      const pointLight2 = new THREE.PointLight(0x6366f1, 2.5, 50)
      pointLight2.position.set(-10, -10, 10)
      scene.add(pointLight2)

      // 1. Core Polyhedron (The Knowledge Core)
      const coreGeo = new THREE.IcosahedronGeometry(4.2, 1)
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.35,
        wireframe: true,
        transparent: true,
        opacity: 0.75,
        roughness: 0.2,
        metalness: 0.8
      })
      const coreMesh = new THREE.Mesh(coreGeo, coreMat)
      scene.add(coreMesh)

      // 1b. Inner Crystal
      const crystalGeo = new THREE.OctahedronGeometry(2.2, 0)
      const crystalMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8,
        wireframe: false,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.4
      })
      const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat)
      scene.add(crystalMesh)

      // 2. Concentric Orbital Rings
      const ring1Geo = new THREE.TorusGeometry(6.5, 0.04, 16, 100)
      const ring1Mat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.55
      })
      const ring1Mesh = new THREE.Mesh(ring1Geo, ring1Mat)
      ring1Mesh.rotation.x = Math.PI / 3
      scene.add(ring1Mesh)

      const ring2Geo = new THREE.TorusGeometry(8.0, 0.035, 16, 100)
      const ring2Mat = new THREE.MeshBasicMaterial({
        color: 0x818cf8,
        transparent: true,
        opacity: 0.45
      })
      const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat)
      ring2Mesh.rotation.y = Math.PI / 4
      scene.add(ring2Mesh)

      // 3. Floating Knowledge Particles Constellation
      const particleCount = density === 'rich' ? 140 : density === 'compact' ? 60 : 90
      const particlePositions = new Float32Array(particleCount * 3)
      for (let i = 0; i < particleCount * 3; i += 3) {
        const radius = 6.5 + Math.random() * 5.5
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        particlePositions[i] = radius * Math.sin(phi) * Math.cos(theta)
        particlePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta)
        particlePositions[i + 2] = radius * Math.cos(phi)
      }

      const particleGeo = new THREE.BufferGeometry()
      particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
      const particleMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.22,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      })
      const particles = new THREE.Points(particleGeo, particleMat)
      scene.add(particles)

      // Mouse Parallax
      let targetRotationX = 0
      let targetRotationY = 0
      let currentRotationX = 0
      let currentRotationY = 0

      const handleMouseMove = (e: MouseEvent) => {
        if (!interactive) return
        const rect = container.getBoundingClientRect()
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1
        const mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
        targetRotationY = mouseX * 0.6
        targetRotationX = -mouseY * 0.6
      }

      window.addEventListener('mousemove', handleMouseMove, { passive: true })

      // Handle Resize with ResizeObserver
      const handleResize = () => {
        if (!container || !renderer) return
        const w = container.clientWidth
        const h = container.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }

      const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null
      if (resizeObserver) {
        resizeObserver.observe(container)
      }

      // Animation Loop
      const startTime = performance.now()
      const animate = () => {
        animId = requestAnimationFrame(animate)
        const elapsedTime = (performance.now() - startTime) * 0.001

        // Smooth Mouse Inertia
        currentRotationX += (targetRotationX - currentRotationX) * 0.05
        currentRotationY += (targetRotationY - currentRotationY) * 0.05

        // Rotations
        coreMesh.rotation.y = elapsedTime * 0.25 + currentRotationY
        coreMesh.rotation.x = elapsedTime * 0.15 + currentRotationX

        crystalMesh.rotation.y = -elapsedTime * 0.4 - currentRotationY
        crystalMesh.rotation.z = elapsedTime * 0.2

        ring1Mesh.rotation.z = elapsedTime * 0.35
        ring1Mesh.rotation.x = Math.PI / 3 + currentRotationX * 0.5

        ring2Mesh.rotation.z = -elapsedTime * 0.25
        ring2Mesh.rotation.y = Math.PI / 4 + currentRotationY * 0.5

        particles.rotation.y = elapsedTime * 0.08 + currentRotationY * 0.3

        // Breathing scale pulse
        const pulse = 1 + Math.sin(elapsedTime * 1.5) * 0.03
        coreMesh.scale.set(pulse, pulse, pulse)

        if (renderer) {
          renderer.render(scene, camera)
        }
      }

      animate()

      // Cleanup on unmount
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        resizeObserver?.disconnect()
        if (animId) cancelAnimationFrame(animId)

        // Dispose geometries & materials
        coreGeo.dispose()
        coreMat.dispose()
        crystalGeo.dispose()
        crystalMat.dispose()
        ring1Geo.dispose()
        ring1Mat.dispose()
        ring2Geo.dispose()
        ring2Mat.dispose()
        particleGeo.dispose()
        particleMat.dispose()

        if (renderer) {
          renderer.dispose()
          if (renderer.domElement && container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement)
          }
        }
      }
    } catch (err) {
      console.warn('WebGL Initialization skipped or not supported:', err)
      setWebGLFailed(true)
    }
  }, [interactive, density])

  if (webGLFailed) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="w-56 h-56 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/10 to-indigo-500/20 blur-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className={`relative w-full h-full overflow-hidden pointer-events-none select-none ${className}`}
    />
  )
}
