import * as THREE from "three";

function forEachMaterial(object: THREE.Object3D, callback: (material: THREE.Material) => void) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) {
      return;
    }

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      if (material) {
        callback(material);
      }
    });
  });
}

export class PortalEffect {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private outsideScene: THREE.Scene;
  private insideScene: THREE.Scene;
  private portalMask: THREE.Mesh;
  private stencilApplied = false;

  constructor(params: {
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    outsideScene: THREE.Scene;
    insideScene: THREE.Scene;
    portalMask: THREE.Mesh;
  }) {
    this.renderer = params.renderer;
    this.camera = params.camera;
    this.outsideScene = params.outsideScene;
    this.insideScene = params.insideScene;
    this.portalMask = params.portalMask;

    this.configurePortalMask();
    this.applyPortalStencil();
  }

  private configurePortalMask() {
    const maskMaterial = this.portalMask.material as THREE.MeshBasicMaterial;
    maskMaterial.colorWrite = false;
    maskMaterial.depthWrite = false;
    maskMaterial.stencilWrite = true;
    maskMaterial.stencilRef = 1;
    maskMaterial.stencilFunc = THREE.AlwaysStencilFunc;
    maskMaterial.stencilZPass = THREE.ReplaceStencilOp;
    this.portalMask.renderOrder = 1;
  }

  private applyPortalStencil() {
    if (this.stencilApplied) {
      return;
    }

    forEachMaterial(this.insideScene, (material) => {
      if (!material.userData.originalStencilConfig) {
        material.userData.originalStencilConfig = {
          stencilWrite: material.stencilWrite,
          stencilRef: material.stencilRef,
          stencilFunc: material.stencilFunc,
          stencilFail: material.stencilFail,
          stencilZFail: material.stencilZFail,
          stencilZPass: material.stencilZPass
        };
      }

      material.stencilWrite = true;
      material.stencilRef = 1;
      material.stencilFunc = THREE.EqualStencilFunc;
      material.stencilFail = THREE.KeepStencilOp;
      material.stencilZFail = THREE.KeepStencilOp;
      material.stencilZPass = THREE.KeepStencilOp;
    });

    this.stencilApplied = true;
  }

  private clearPortalStencil() {
    forEachMaterial(this.insideScene, (material) => {
      const original = material.userData.originalStencilConfig;
      if (!original) {
        return;
      }
      material.stencilWrite = original.stencilWrite ?? false;
      material.stencilRef = original.stencilRef ?? 0;
      material.stencilFunc = original.stencilFunc ?? THREE.AlwaysStencilFunc;
      material.stencilFail = original.stencilFail ?? THREE.KeepStencilOp;
      material.stencilZFail = original.stencilZFail ?? THREE.KeepStencilOp;
      material.stencilZPass = original.stencilZPass ?? THREE.ReplaceStencilOp;
    });

    this.stencilApplied = false;
  }

  renderOutside() {
    this.applyPortalStencil();
    this.renderer.autoClear = true;
    this.renderer.clear();
    this.portalMask.visible = true;
    this.renderer.state.buffers.stencil.setTest(true);
    this.renderer.render(this.outsideScene, this.camera);
    this.renderer.clearDepth();
    this.renderer.render(this.insideScene, this.camera);
    this.renderer.state.buffers.stencil.setTest(false);
    this.portalMask.visible = false;
  }

  renderInside() {
    this.clearPortalStencil();
    this.renderer.autoClear = true;
    this.renderer.clear();
    this.renderer.state.buffers.stencil.setTest(false);
    this.renderer.render(this.insideScene, this.camera);
  }

  dispose() {
    this.clearPortalStencil();
  }
}
