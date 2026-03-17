import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:http/http.dart' as http;

/// OpenStreetMap Nominatim - free geocoding (use sparingly, 1 req/sec).
Future<LatLng?> _geocode(String address) async {
  if (address.isEmpty) return null;
  try {
    final uri = Uri.parse(
      'https://nominatim.openstreetmap.org/search'
      '?q=${Uri.encodeComponent('$address, Kerala, India')}'
      '&format=json'
      '&limit=1',
    );
    final response = await http.get(
      uri,
      headers: {'User-Agent': 'EcoloopDelivery/1.0'},
    );
    if (response.statusCode != 200) return null;
    final list = jsonDecode(response.body) as List<dynamic>?;
    if (list == null || list.isEmpty) return null;
    final item = list.first as Map<String, dynamic>;
    final lat = double.tryParse(item['lat']?.toString() ?? '');
    final lon = double.tryParse(item['lon']?.toString() ?? '');
    if (lat == null || lon == null) return null;
    return LatLng(lat, lon);
  } catch (_) {
    return null;
  }
}

class DeliveryMapPage extends StatefulWidget {
  const DeliveryMapPage({
    super.key,
    required this.deliveries,
  });

  final List<dynamic> deliveries;

  @override
  State<DeliveryMapPage> createState() => _DeliveryMapPageState();
}

class _DeliveryMapPageState extends State<DeliveryMapPage> {
  final MapController _mapController = MapController();
  final Map<String, LatLng> _deliveryCoordinates = {};
  bool _loading = true;
  String? _error;
  static const LatLng _defaultCenter = LatLng(10.0, 76.5); // Kerala region
  static const double _defaultZoom = 10.0;

  @override
  void initState() {
    super.initState();
    _geocodeAll();
  }

  Future<void> _geocodeAll() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final list = widget.deliveries;
    for (int i = 0; i < list.length; i++) {
      if (!mounted) return;
      final d = list[i];
      final dynamic shipping = d['shippingAddress'];
      String address = '';
      if (shipping is String && shipping.trim().length > 5) {
        address = shipping;
      } else if (shipping is Map) {
        final parts = [
          shipping['address'],
          shipping['city'],
          shipping['state'],
          shipping['pincode'],
          d['userId']?['wardNumber'] != null ? 'Ward ${d['userId']?['wardNumber']}' : null,
        ].whereType<String>().where((s) => s.trim().isNotEmpty);
        address = parts.join(', ');
      }

      if (address.trim().isEmpty || address == 'No address provided') {
        address = (d['userId']?['address']?.toString() ?? '');
      }

      if (address.trim().isEmpty) continue;
      final key = (d['_id'] ?? i).toString();
      if (_deliveryCoordinates.containsKey(key)) continue;
      final latLng = await _geocode(address);
      if (latLng != null && mounted) {
        setState(() => _deliveryCoordinates[key] = latLng);
      }
      await Future<void>.delayed(const Duration(milliseconds: 1100)); // Nominatim policy: ~1 req/sec
    }
    if (mounted) setState(() => _loading = false);
  }

  LatLng _getMapCenter() {
    if (_deliveryCoordinates.isEmpty) return _defaultCenter;
    double sumLat = 0, sumLon = 0;
    int n = 0;
    for (final p in _deliveryCoordinates.values) {
      sumLat += p.latitude;
      sumLon += p.longitude;
      n++;
    }
    if (n == 0) return _defaultCenter;
    return LatLng(sumLat / n, sumLon / n);
  }

  @override
  Widget build(BuildContext context) {
    final center = _getMapCenter();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Delivery Map'),
        backgroundColor: Colors.green.shade800,
        foregroundColor: Colors.white,
        actions: [
          if (_deliveryCoordinates.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.center_focus_strong),
              onPressed: () {
                _mapController.move(center, _defaultZoom);
              },
            ),
        ],
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: center,
              initialZoom: _defaultZoom,
              interactionOptions: const InteractionOptions(flags: InteractiveFlag.all),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.ecoloop.mobile',
              ),
              if (_deliveryCoordinates.isNotEmpty)
                MarkerLayer(
                  markers: _deliveryCoordinates.entries.map((e) {
                    final id = e.key;
                    final point = e.value;
                    dynamic delivery;
                    try {
                      delivery = widget.deliveries.firstWhere(
                        (d) => (d['_id'] ?? '').toString() == id,
                      );
                    } catch (_) {
                      delivery = <String, dynamic>{};
                    }
                    final orderLabel = id.length >= 6 ? id.substring(0, 6).toUpperCase() : id.toUpperCase();
                    final customerName = delivery['userId']?['name']?.toString() ?? 'Order';
                    return Marker(
                      point: point,
                      width: 120,
                      height: 80,
                      child: GestureDetector(
                        onTap: () => _showMarkerInfo(context, orderLabel, customerName, delivery),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.green.shade700,
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: const [
                                  BoxShadow(blurRadius: 4, offset: Offset(0, 2)),
                                ],
                              ),
                              child: Text(
                                '#$orderLabel',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                              ),
                            ),
                            const Icon(Icons.location_on, color: Colors.red, size: 32),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
            ],
          ),
          if (_loading)
            Positioned(
              top: 16,
              left: 16,
              right: 16,
              child: Material(
                elevation: 2,
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2)),
                      const SizedBox(width: 12),
                      Text('Geocoding addresses... ${_deliveryCoordinates.length}/${widget.deliveries.length}', style: TextStyle(fontSize: 12, color: Colors.grey.shade700)),
                    ],
                  ),
                ),
              ),
            ),
          if (!_loading && _deliveryCoordinates.isEmpty && widget.deliveries.isNotEmpty)
            Positioned(
              top: 16,
              left: 16,
              right: 16,
              child: Material(
                elevation: 2,
                borderRadius: BorderRadius.circular(8),
                color: Colors.amber.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.amber.shade800),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Could not find coordinates for addresses. Map centered on default region.',
                          style: TextStyle(fontSize: 12, color: Colors.amber.shade900),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showMarkerInfo(BuildContext context, String orderLabel, String customerName, dynamic delivery) {
    final dynamic shipping = delivery['shippingAddress'];
    final userId = delivery['userId'];
    String address = '';
    if (shipping is String && shipping.trim().length > 5) {
      address = shipping;
    } else if (shipping is Map) {
      address = shipping['address']?.toString() ?? '';
    }
    if (address.trim().isEmpty || address == 'No address provided') {
      address = userId?['address']?.toString() ?? 'No address provided';
    }
    showModalBottomSheet(
      context: context,
      builder: (context) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Order #$orderLabel', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text('Customer: $customerName', style: TextStyle(color: Colors.grey.shade700)),
            const SizedBox(height: 4),
            Text('Address: $address', style: TextStyle(color: Colors.grey.shade700)),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.green.shade700),
                child: const Text('Close'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
