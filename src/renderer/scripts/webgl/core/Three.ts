import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'

type Options = {
  dpr?: number
  shadowMap?: boolean
}

export abstract class Three {
  readonly renderer: THREE.WebGLRenderer
  protected camera: THREE.PerspectiveCamera
  readonly scene: THREE.Scene
  protected readonly clock: THREE.Clock
  private _stats?: Stats
  private _controls?: OrbitControls
  private abortController?: AbortController

  constructor(
    canvas: HTMLCanvasElement,
    private options?: Options,
  ) {
    this.renderer = this.createRenderer(canvas)
    this.camera = this.createCamera()
    this.scene = this.createScene()
    this.clock = new THREE.Clock()

    this.addEvents()
  }

  private createRenderer(canvas: HTMLCanvasElement) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(2, Math.round(this.options?.dpr ?? window.devicePixelRatio)))
    renderer.shadowMap.enabled = this.options?.shadowMap ?? false
    return renderer
  }

  private createCamera() {
    const camera = new THREE.PerspectiveCamera(40, this.size.aspect, 1, 20)
    camera.position.z = 5
    return camera
  }

  private createScene() {
    const scene = new THREE.Scene()
    return scene
  }

  protected get stats() {
    if (!this._stats) {
      this._stats = new Stats()
      document.body.appendChild(this._stats.dom)
    }
    return this._stats
  }

  private addEvents() {
    this.abortController = new AbortController()

    window.addEventListener(
      'resize',
      () => {
        const { innerWidth: width, innerHeight: height } = window
        this.renderer.setSize(width, height)
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
      },
      { signal: this.abortController.signal },
    )

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'visible') this.clock.start()
        else if (document.visibilityState === 'hidden') this.clock.stop()
      },
      { signal: this.abortController.signal },
    )
  }

  get size() {
    const { width, height } = this.renderer.domElement
    return { width, height, aspect: width / height }
  }

  protected get controls() {
    if (!this._controls) {
      this._controls = new OrbitControls(this.camera, this.renderer.domElement)
    }
    return this._controls
  }

  protected coveredScale(imageAspect: number) {
    const screenAspect = this.size.aspect
    if (screenAspect < imageAspect) return [screenAspect / imageAspect, 1]
    else return [1, imageAspect / screenAspect]
  }

  protected render() {
    this.renderer.setRenderTarget(null)
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.renderer.setAnimationLoop(null)
    this.renderer.dispose()
    this.abortController?.abort()
  }
}