import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:ecoloop_mobile/screens/order_chat_page.dart';
import 'package:ecoloop_mobile/screens/delivery_map_page.dart';
import 'package:ecoloop_mobile/screens/delivery_route_page.dart';

const String apiBaseUrl = 'https://ecoloop-psi.vercel.app';

class DeliveryDashboard extends StatefulWidget {
  const DeliveryDashboard({super.key});

  @override
  State<DeliveryDashboard> createState() => _DeliveryDashboardState();
}

class _DeliveryDashboardState extends State<DeliveryDashboard> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  bool _isLoading = true;
  bool _isAvailable = true;
  List<dynamic> _deliveries = [];
  Map<String, dynamic>? _user;
  String _activeTab = 'all';
  String? _assignedWard;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    await _loadUserFromPrefs();
    await _fetchDeliveries();
    await _fetchWardAssignment();
  }

  Future<void> _loadUserFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      setState(() => _user = jsonDecode(userStr));
    }
  }

  Future<void> _fetchDeliveries() async {
    try {
      setState(() => _isLoading = true);
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) {
        _logout();
        return;
      }
      final response = await http.get(
        Uri.parse('$apiBaseUrl/api/orders/my-deliveries'),
        headers: {'token': token},
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() => _deliveries = data['deliveries'] ?? []);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchWardAssignment() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) return;
      final response = await http.get(
        Uri.parse('$apiBaseUrl/api/user/my-ward-assignment'),
        headers: {'token': token},
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (mounted) {
          setState(() => _assignedWard = data['wardNumber']?.toString());
        }
      }
    } catch (_) {}
  }

  Future<void> _updateStatus(String orderId, String newStatus) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) return;
      final response = await http.put(
        Uri.parse('$apiBaseUrl/api/orders/update-status/$orderId'),
        headers: {'Content-Type': 'application/json', 'token': token},
        body: jsonEncode({'status': newStatus}),
      );
      if (response.statusCode == 200) {
        _fetchDeliveries();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Status updated to $newStatus')),
          );
        }
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to update status')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (!mounted) return;
    Navigator.of(context).pushReplacementNamed('/login');
  }

  bool _isOrderCompleted(dynamic d) {
    final status = (d['status'] ?? '').toString().toLowerCase();
    final deliveryStatus = (d['deliveryStatus'] ?? '').toString().toLowerCase();
    return status == 'delivered' || deliveryStatus == 'delivered';
  }

  bool _isOrderInTransit(dynamic d) {
    final status = (d['status'] ?? '').toString().toLowerCase();
    final deliveryStatus = (d['deliveryStatus'] ?? '').toString().toLowerCase();
    return status == 'shipped' || deliveryStatus == 'in_transit' || deliveryStatus == 'in-transit';
  }

  bool _isOrderPending(dynamic d) {
    return !_isOrderCompleted(d) && !_isOrderInTransit(d);
  }

  List<dynamic> get _filteredDeliveries {
    if (_activeTab == 'all') return _deliveries;
    if (_activeTab == 'completed') return _deliveries.where(_isOrderCompleted).toList();
    if (_activeTab == 'in-transit') return _deliveries.where(_isOrderInTransit).toList();
    if (_activeTab == 'pending') return _deliveries.where(_isOrderPending).toList();
    return _deliveries;
  }

  int get _totalCount => _deliveries.length;
  int get _pendingCount => _deliveries.where(_isOrderPending).length;
  int get _completedCount => _deliveries.where(_isOrderCompleted).length;

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'assigned':
        return Colors.orange;
      case 'in-transit':
      case 'in_transit':
      case 'shipped':
        return Colors.blue;
      case 'completed':
      case 'delivered':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _displayStatus(dynamic d) {
    if (_isOrderCompleted(d)) return 'Delivered';
    if (_isOrderInTransit(d)) return 'In-Transit';
    return 'Pending';
  }

  Future<void> _launchCall(String? phone) async {
    if (phone == null || phone.isEmpty) return;
    final uri = Uri(scheme: 'tel', path: phone.trim().replaceAll(RegExp(r'[^\d+]'), ''));
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: Colors.green.shade50,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Delivery Dashboard', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text(
              'Assigned Coverage: Ward ${_assignedWard ?? "—"}',
              style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.9)),
            ),
          ],
        ),
        backgroundColor: Colors.green.shade800,
        foregroundColor: Colors.white,
        actions: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Available', style: TextStyle(fontSize: 12)),
              const SizedBox(width: 4),
              Switch(
                value: _isAvailable,
                onChanged: (v) => setState(() => _isAvailable = v),
                activeColor: Colors.white,
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('Welcome, ${_user?['name'] ?? 'Partner'}', style: const TextStyle(fontSize: 12)),
                    Text('Ready to serve', style: TextStyle(fontSize: 10, color: Colors.white.withOpacity(0.9))),
                  ],
                ),
                const SizedBox(width: 8),
                CircleAvatar(
                  backgroundColor: Colors.white,
                  child: Text(
                    (_user?['name'] ?? 'D').toString().substring(0, 1).toUpperCase(),
                    style: TextStyle(color: Colors.green.shade800, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      drawer: _buildDrawer(),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadInitialData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _buildSummaryCards(),
                    const SizedBox(height: 16),
                    _buildFiltersAndMap(),
                    const SizedBox(height: 16),
                    _buildDeliveryList(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSummaryCards() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _summaryCard('Total Deliveries', _totalCount.toString(), Icons.local_shipping, Colors.green),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _summaryCard('Pending', _pendingCount.toString(), Icons.schedule, Colors.orange),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _summaryCard('Completed', _completedCount.toString(), Icons.check_circle, Colors.green),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _summaryCard('Distance Covered', '— km', Icons.straighten, Colors.blue),
            ),
          ],
        ),
      ],
    );
  }

  Widget _summaryCard(String label, String value, IconData icon, Color color) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
            Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade700), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _buildFiltersAndMap() {
    return Row(
      children: [
        Expanded(
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _filterChip('All Deliveries', Icons.local_shipping, 'all'),
                _filterChip('Pending', Icons.schedule, 'pending'),
                _filterChip('In-Transit', Icons.fire_truck, 'in-transit'),
                _filterChip('Completed', Icons.check_circle, 'completed'),
              ],
            ),
          ),
        ),
        const SizedBox(width: 8),
        Material(
          color: Colors.green.shade700,
          borderRadius: BorderRadius.circular(8),
          child: InkWell(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (context) => DeliveryMapPage(deliveries: _filteredDeliveries),
                ),
              );
            },
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.map, color: Colors.white, size: 20),
                  const SizedBox(width: 6),
                  const Text('Show Map', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _filterChip(String label, IconData icon, String tab) {
    final selected = _activeTab == tab;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: selected ? Colors.white : Colors.grey.shade700),
            const SizedBox(width: 4),
            Text(label),
          ],
        ),
        selected: selected,
        onSelected: (_) => setState(() => _activeTab = tab),
        selectedColor: Colors.green.shade700,
        checkmarkColor: Colors.white,
      ),
    );
  }

  Widget _buildDeliveryList() {
    final list = _filteredDeliveries;
    if (list.isEmpty) {
      return Padding(
        padding: const EdgeInsets.only(top: 32),
        child: Center(
          child: Column(
            children: [
              Icon(Icons.inventory_2_outlined, size: 56, color: Colors.grey.shade400),
              const SizedBox(height: 12),
              Text('No deliveries for $_activeTab', style: TextStyle(color: Colors.grey.shade600)),
            ],
          ),
        ),
      );
    }
    return Column(
      children: list.map<Widget>((d) => _buildDeliveryCard(d)).toList(),
    );
  }

  Widget _buildDeliveryCard(dynamic delivery) {
    final idStr = (delivery['_id'] ?? '').toString();
    final orderId = idStr.length >= 6 ? idStr.substring(0, 6).toUpperCase() : idStr.toUpperCase();
    final status = _displayStatus(delivery);
    final statusColor = _statusColor(status);
    final userId = delivery['userId'];
    final dynamic shipping = delivery['shippingAddress'];
    final String customerName = userId?['name'] ?? 'Guest';
    String phone = '';
    if (shipping is Map) {
      phone = shipping['phone']?.toString() ?? '';
    }
    if (phone.isEmpty) {
      phone = userId?['phone']?.toString() ?? '';
    }

    String address = '';
    if (shipping is String && shipping.trim().length > 5) {
      address = shipping;
    } else if (shipping is Map) {
      address = shipping['address']?.toString() ?? '';
    }
    if (address.trim().isEmpty || address == 'No address provided') {
      address = userId?['address']?.toString() ?? 'No address provided';
    }

    final items = (delivery['items'] as List?)?.map((i) => i['name'] ?? i['productId']?['name'] ?? 'Item').join(', ') ?? '—';
    final ward = userId?['wardNumber'] ?? '';
    final createdAt = delivery['createdAt'] != null
        ? DateTime.parse(delivery['createdAt'].toString()).toLocal()
        : null;
    final timeStr = createdAt != null
        ? '${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}:${createdAt.second.toString().padLeft(2, '0')} ${createdAt.hour >= 12 ? 'PM' : 'AM'}'
        : '—';
    final isPending = _isOrderPending(delivery);
    final isInTransit = _isOrderInTransit(delivery);

    return Card(
      elevation: 3,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.shopping_cart, size: 18, color: Colors.grey.shade700),
                const SizedBox(width: 6),
                Text('#$orderId', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: statusColor.withOpacity(0.5)),
                  ),
                  child: Text(status, style: TextStyle(color: statusColor, fontWeight: FontWeight.w600, fontSize: 12)),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade100,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text('medium', style: TextStyle(fontSize: 11, color: Colors.orange)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.access_time, size: 14, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Text(timeStr, style: TextStyle(fontSize: 12, color: Colors.grey.shade700)),
                const SizedBox(width: 12),
                Icon(Icons.straighten, size: 14, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                const Text('See route for distance', style: TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.person, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 6),
                Expanded(child: Text(customerName, style: const TextStyle(fontWeight: FontWeight.w600))),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.phone, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 6),
                Expanded(child: Text(phone.isNotEmpty ? phone : 'No phone', style: TextStyle(fontSize: 13, color: Colors.grey.shade700))),
                if (phone.isNotEmpty)
                  TextButton(
                    onPressed: () => _launchCall(phone),
                    child: const Text('Call'),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.location_on, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 6),
                Expanded(child: Text(address.isEmpty ? 'No address' : address, style: TextStyle(fontSize: 13, color: Colors.grey.shade700))),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Icon(Icons.inventory_2_outlined, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 6),
                Expanded(child: Text('$items', style: TextStyle(fontSize: 13, color: Colors.grey.shade700), maxLines: 1, overflow: TextOverflow.ellipsis)),
              ],
            ),
            if (ward.toString().isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.amber.shade200),
                ),
                child: Text('Notes: Ward $ward', style: TextStyle(fontSize: 12, color: Colors.amber.shade900)),
              ),
            ],
            const SizedBox(height: 12),
            Wrap(
              alignment: WrapAlignment.end,
              spacing: 4,
              children: [
                TextButton.icon(
                  onPressed: () => _showOrderDetails(delivery),
                  icon: const Icon(Icons.bar_chart, size: 16),
                  label: const Text('Details', style: TextStyle(fontSize: 12)),
                ),
                TextButton.icon(
                  onPressed: () => _openRoute(delivery),
                  icon: const Icon(Icons.route, size: 16),
                  label: const Text('View Route', style: TextStyle(fontSize: 12)),
                ),
                TextButton.icon(
                  onPressed: () => _openChatWithSeller(delivery),
                  icon: const Icon(Icons.chat_bubble_outline, size: 16),
                  label: const Text('Contact Seller', style: TextStyle(fontSize: 12)),
                ),
              ],
            ),
            if (isPending || isInTransit) ...[
              const Divider(height: 20),
              Wrap(
                alignment: WrapAlignment.end,
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (isPending)
                    ElevatedButton.icon(
                      onPressed: () => _updateStatus(delivery['_id'], 'in-transit'),
                      icon: const Icon(Icons.local_shipping, size: 18),
                      label: const Text('Start Delivery'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue, 
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                    ),
                  if (isInTransit)
                    ElevatedButton.icon(
                      onPressed: () => _updateStatus(delivery['_id'], 'delivered'),
                      icon: const Icon(Icons.check, size: 18),
                      label: const Text('Complete'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green, 
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _openChatWithSeller(dynamic delivery) {
    final items = delivery['items'] as List?;
    if (items == null || items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No seller for this order')));
      return;
    }
    final productId = items[0]['productId'];
    final seller = productId?['seller_id'];
    if (seller == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No seller for this order')));
      return;
    }
    final sellerId = seller['_id']?.toString() ?? seller.toString();
    final sellerName = seller['name']?.toString() ?? 'Seller';
    final orderId = (delivery['_id'] ?? '').toString();

    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (context) => OrderChatPage(
          orderId: orderId,
          sellerId: sellerId,
          sellerName: sellerName,
        ),
      ),
    );
  }

  void _openRoute(dynamic delivery) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (context) => DeliveryRoutePage(delivery: delivery),
      ),
    );
  }

  void _showOrderDetails(dynamic delivery) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.5,
        maxChildSize: 0.9,
        minChildSize: 0.25,
        expand: false,
        builder: (context, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 12),
              Text('Order #${(delivery['_id'] ?? '').toString().substring(0, 6).toUpperCase()}', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text('Status: ${_displayStatus(delivery)}', style: TextStyle(color: _statusColor(_displayStatus(delivery)), fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Text('Customer: ${delivery['userId']?['name'] ?? '—'}'),
              Text('Address: ${(delivery['shippingAddress'] ?? {})['address'] ?? '—'}'),
              const SizedBox(height: 16),
              const Text('Items:', style: TextStyle(fontWeight: FontWeight.bold)),
              ...((delivery['items'] as List?) ?? []).map<Widget>((i) => Padding(
                padding: const EdgeInsets.only(left: 8, top: 4),
                child: Text('• ${i['name'] ?? i['productId']?['name'] ?? 'Item'} x ${i['quantity'] ?? 1}'),
              )),
              const SizedBox(height: 24),
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(24, 48, 24, 24),
            color: Colors.green.shade800,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('EcoLoop', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 8),
                Text('Delivery Partner', style: TextStyle(fontSize: 14, color: Colors.white.withOpacity(0.9))),
              ],
            ),
          ),
          ListTile(
            leading: const Icon(Icons.dashboard, color: Colors.green),
            title: const Text('Dashboard'),
            selected: _activeTab == 'all',
            onTap: () { setState(() => _activeTab = 'all'); Navigator.pop(context); },
          ),
          ListTile(
            leading: const Icon(Icons.route, color: Colors.blue),
            title: const Text('My Routes'),
            selected: _activeTab == 'in-transit',
            onTap: () { setState(() => _activeTab = 'in-transit'); Navigator.pop(context); },
          ),
          ListTile(
            leading: const Icon(Icons.schedule, color: Colors.orange),
            title: const Text('Schedule (Pending)'),
            selected: _activeTab == 'pending',
            onTap: () { setState(() => _activeTab = 'pending'); Navigator.pop(context); },
          ),
          ListTile(
            leading: const Icon(Icons.account_balance_wallet, color: Colors.amber),
            title: const Text('My Earnings'),
            onTap: () { Navigator.pop(context); ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Earnings coming soon'))); },
          ),
          ListTile(
            leading: const Icon(Icons.person),
            title: const Text('Profile'),
            onTap: () { Navigator.pop(context); _showProfileDialog(); },
          ),
          ListTile(
            leading: const Icon(Icons.event_available),
            title: const Text('Weekly Availability'),
            onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/weekly-availability'); },
          ),
          ListTile(
            leading: const Icon(Icons.edit_calendar),
            title: const Text('Apply Leave'),
            onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/apply-leave'); },
          ),
          ListTile(
            leading: const Icon(Icons.description),
            title: const Text('My Leave Status'),
            onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/my-leave-status'); },
          ),
          ListTile(
            leading: const Icon(Icons.headset_mic),
            title: const Text('Support & Help'),
            onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/support-help'); },
          ),
          const Spacer(),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Logout', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w600)),
            onTap: _logout,
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  void _showProfileDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Profile'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Name: ${_user?['name'] ?? '—'}'),
              const SizedBox(height: 8),
              Text('Email: ${_user?['email'] ?? '—'}'),
              const SizedBox(height: 8),
              Text('Phone: ${_user?['phone'] ?? '—'}'),
              const SizedBox(height: 8),
              Text('Role: ${_user?['role'] ?? '—'}'),
              const SizedBox(height: 8),
              Text('Assigned Ward: ${_assignedWard ?? 'Not assigned'}'),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
        ],
      ),
    );
  }
}
