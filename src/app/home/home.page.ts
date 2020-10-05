import {Component, ElementRef, ViewChild} from '@angular/core';
import {
  CameraPosition,
  GoogleMap,
  GoogleMaps,
  GoogleMapsEvent,
  ILatLng,
  LatLng,
  Marker,
  MarkerIcon,
  MarkerOptions
} from '@ionic-native/google-maps/ngx';
import {Platform} from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  @ViewChild('map')
  mapElement: ElementRef;

  map: GoogleMap;
  markerPool: Marker[] = [];
  mapListItems: { geoLat: string, geoLng: string }[] = [];

  nextClickId: number = 0;

  constructor(private platform: Platform) {
  }

  async ionViewDidEnter() {
    this.generateRandomItems();
    await this.platform.ready();
    this.createMap();
  }

  generateRandomItems() {
    this.mapListItems = [];
    for (let i = 0; i < 50; i++) {
      const lat = 50 + Math.random();
      const lng = 7 + Math.random();
      this.mapListItems.push({
        geoLat: '' + lat,
        geoLng: '' + lng
      });
    }
  }

  createMap(): Promise<void> {
    return new Promise<void>(resolve => {

      const mapOptions = {
        camera: {
          zoom: 6,
          target: {
            lat: 50.813903,
            lng: 7.1772422
          },
          duration: 100,
        },
        preferences: {
          zoom: {
            minZoom: 1,
            maxZoom: 19
          }
        },
        controls: {
          compass: false,
          myLocationButton: false,
          indoorPicker: false,
          zoom: false,
          mapToolbar: false
        }
      };

      this.map = GoogleMaps.create(this.mapElement.nativeElement, mapOptions);
      this.subscribeToMapEvents();
      resolve();
    });
  }

  private subscribeToMapEvents() {
    this.map.on(GoogleMapsEvent.MAP_READY).subscribe(() => {
      console.log('map ready');
      this.createMarkerPool().then(() => {
        this.recycleMarkers(true);
      });
    });
  }

  private createMarkerPool() {
    return new Promise((resolve) => {
      const markerPromises: Promise<Marker>[] = [];
      const markerOptions: MarkerOptions = {
        position: new LatLng(0, 0),
        visible: false,
        disableAutoPan: true,
        zIndex: 0
      };

      for (let i = 0; i < 50; i++) {
        markerPromises.push(this.map.addMarker(markerOptions));
      }

      Promise.all(markerPromises).then(markers => {
        for (const marker of markers) {
          marker.set('activeMarker', false);

          marker.on(GoogleMapsEvent.MARKER_CLICK).subscribe(params => {
            const tempMarker: Marker = params[1];

            const activeIcon: MarkerIcon = {
              size: {
                width: 36,
                height: 59
              }
            };

            tempMarker.setIcon(activeIcon);
            tempMarker.setZIndex(1);
          });
        }

        this.markerPool = markers;
        resolve();
      });
    });
  }

  private recycleMarkers(onMapInit: boolean) {
    if (this.mapListItems && this.map) {
      for (let i = 0; i < this.mapListItems.length; i++) {
        const item = this.mapListItems[i];

        const latlng: ILatLng = {
          lat: parseFloat(item.geoLat),
          lng: parseFloat(item.geoLng)
        };

        if ((latlng.lat >= -90 && latlng.lat <= 90) && (latlng.lng >= -180 && latlng.lng <= 180)) {

          const marker = this.markerPool[i];
          marker.setPosition(latlng);
          marker.setVisible(true);
        }
      }

      const cameraPosition: CameraPosition<any> = {
        zoom: this.map.getCameraZoom(),
        target: [],
        duration: 50
      };

      if (onMapInit) {
        cameraPosition.zoom = 1;
        for (const marker of this.markerPool) {
          cameraPosition.target.push({
            lat: marker.getPosition().lat,
            lng: marker.getPosition().lng,
          });
        }

        this.map.animateCamera(cameraPosition);
      }
    }
  }

  private resetPoolMarkers() {
    for (const marker of this.markerPool) {
      marker.setVisible(false);
      marker.setPosition({lat: 0, lng: 0});
      marker.set('markerData', undefined);
      marker.set('activeMarker', false);
    }
  }

  again() {
    this.resetPoolMarkers();
    this.generateRandomItems();
    this.recycleMarkers(false);
  }

  simulateClick() {
    const marker = this.markerPool[this.nextClickId];
    marker.trigger(GoogleMapsEvent.MARKER_CLICK, marker.getPosition(), marker);
    this.nextClickId++;
    if (this.nextClickId === 50) {
      this.nextClickId = 0;
    }
  }
}
