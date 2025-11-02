/**
 * OverlappingMarkerSpiderfier for Google Maps API v3
 * Simplified implementation for React
 *
 * This creates a spider/spiral effect when markers overlap
 */

class OverlappingMarkerSpiderfier {
  constructor(map, options = {}) {
    this.map = map;
    this.markers = [];
    this.spiderfiedMarkers = [];
    this.isSpiderfied = false;

    // Configuration
    this.options = {
      markersWontMove: true,
      markersWontHide: true,
      keepSpiderfied: false,
      nearbyDistance: 20, // pixels
      circleSpiralSwitchover: 9,
      circleFootSeparation: 23,
      spiralFootSeparation: 26,
      spiralLengthStart: 11,
      spiralLengthFactor: 4,
      ...options,
    };

    this.listeners = {
      click: [],
      spiderfy: [],
      unspiderfy: [],
    };
  }

  addMarker(marker) {
    this.markers.push(marker);
    marker._oms = this;

    const originalClickListener = marker.addListener("click", (e) => {
      this.markerClick(marker, e);
    });

    marker._omsClickListener = originalClickListener;
    return this;
  }

  removeMarker(marker) {
    const index = this.markers.indexOf(marker);
    if (index > -1) {
      this.markers.splice(index, 1);
      if (marker._omsClickListener) {
        window.google.maps.event.removeListener(marker._omsClickListener);
      }
      delete marker._oms;
    }
    return this;
  }

  clearMarkers() {
    this.markers.forEach((marker) => {
      if (marker._omsClickListener) {
        window.google.maps.event.removeListener(marker._omsClickListener);
      }
      delete marker._oms;
    });
    this.markers = [];
    this.unspiderfy();
    return this;
  }

  markerClick(marker, event) {
    const nearbyMarkers = this.findNearbyMarkers(marker);

    if (nearbyMarkers.length > 1) {
      // There are overlapping markers, spiderfy them
      this.spiderfy(nearbyMarkers, marker);
    } else {
      // No overlap, trigger normal click for sidebar
      this.unspiderfy();
      this.trigger("click", marker, event);
    }
  }

  findNearbyMarkers(marker) {
    const markerLatLng = marker.getPosition();
    const markerPoint = this.llToPt(markerLatLng);
    const nearby = [];

    this.markers.forEach((m) => {
      if (m === marker) {
        nearby.push(m);
        return;
      }

      const mLatLng = m.getPosition();
      const mPoint = this.llToPt(mLatLng);

      const distance = Math.sqrt(
        Math.pow(markerPoint.x - mPoint.x, 2) +
          Math.pow(markerPoint.y - mPoint.y, 2),
      );

      if (distance < this.options.nearbyDistance) {
        nearby.push(m);
      }
    });

    return nearby;
  }

  spiderfy(markers, centerMarker) {
    this.unspiderfy();

    const centerLatLng = centerMarker.getPosition();
    const centerPoint = this.llToPt(centerLatLng);

    this.spiderfiedMarkers = markers;
    const positions = this.generatePtsCircle(markers.length, centerPoint);

    markers.forEach((marker, index) => {
      const originalPosition = marker.getPosition();
      const newPoint = positions[index];
      const newLatLng = this.ptToLl(newPoint);

      // Store original position
      marker._omsOriginalPosition = originalPosition;
      marker._omsOriginalIcon = marker.getIcon();

      // Animate to new position
      this.animateMarkerTo(marker, newLatLng);

      // Add leg line
      const legLine = new window.google.maps.Polyline({
        map: this.map,
        path: [centerLatLng, newLatLng],
        strokeColor: "#444444",
        strokeOpacity: 0.5,
        strokeWeight: 1.5,
        clickable: false,
        zIndex: 0,
      });

      marker._omsLeg = legLine;
    });

    this.isSpiderfied = true;
    this.trigger("spiderfy", markers);
  }

  unspiderfy() {
    if (!this.isSpiderfied) return;

    this.spiderfiedMarkers.forEach((marker) => {
      if (marker._omsOriginalPosition) {
        this.animateMarkerTo(marker, marker._omsOriginalPosition);
        delete marker._omsOriginalPosition;
      }

      if (marker._omsLeg) {
        marker._omsLeg.setMap(null);
        delete marker._omsLeg;
      }

      if (marker._omsOriginalIcon) {
        delete marker._omsOriginalIcon;
      }
    });

    this.spiderfiedMarkers = [];
    this.isSpiderfied = false;
    this.trigger("unspiderfy");
  }

  generatePtsCircle(count, centerPoint) {
    const circumference = this.options.circleFootSeparation * (2 + count);
    const legLength = circumference / (Math.PI * 2);
    const angleStep = (Math.PI * 2) / count;

    return Array.from({ length: count }, (_, i) => {
      const angle = angleStep * i;
      return {
        x: centerPoint.x + legLength * Math.cos(angle),
        y: centerPoint.y + legLength * Math.sin(angle),
      };
    });
  }

  animateMarkerTo(marker, newLatLng) {
    // Simple animation: just set position
    // You can enhance this with smooth animation if needed
    marker.setPosition(newLatLng);
  }

  llToPt(latLng) {
    const projection = this.map.getProjection();
    const bounds = this.map.getBounds();
    const topRight = projection.fromLatLngToPoint(bounds.getNorthEast());
    const bottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest());
    const scale = Math.pow(2, this.map.getZoom());
    const point = projection.fromLatLngToPoint(latLng);

    return {
      x: (point.x - bottomLeft.x) * scale,
      y: (point.y - topRight.y) * scale,
    };
  }

  ptToLl(point) {
    const projection = this.map.getProjection();
    const bounds = this.map.getBounds();
    const topRight = projection.fromLatLngToPoint(bounds.getNorthEast());
    const bottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest());
    const scale = Math.pow(2, this.map.getZoom());

    const worldPoint = {
      x: point.x / scale + bottomLeft.x,
      y: point.y / scale + topRight.y,
    };

    return projection.fromPointToLatLng(worldPoint);
  }

  addListener(event, handler) {
    if (this.listeners[event]) {
      this.listeners[event].push(handler);
    }
    return this;
  }

  trigger(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((handler) => handler(...args));
    }
  }
}

export default OverlappingMarkerSpiderfier;
