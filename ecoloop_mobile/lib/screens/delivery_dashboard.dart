import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

// Hosted backend base URL (Vercel)
const String apiBaseUrl = 'https://ecoloop-eight.vercel.app';

class DeliveryDashboard extends StatefulWidget {
  const DeliveryDashboard({super.key});

  @override
  State<DeliveryDashboard> createState() => _DeliveryDashboardState();
}

class _DeliveryDashboardState extends State<DeliveryDashboard> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  
  bool _isLoading = true;
  List<dynamic> _deliveries = [];
  Map<String, dynamic>? _user;
  String _activeTab = 'all'; // 'all', 'in-transit', 'completed', 'pending'
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
      setState(() {
        _user = jsonDecode(userStr);
      });
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
        setState(() {
          _deliveries = data['deliveries'] ?? [];
        });
      } else {
        print('Failed to fetch deliveries: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching deliveries: $e');
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
          setState(() {
            _assignedWard = data['wardNumber']?.toString();
          });
        }
      }
    } catch (e) {
      print('Error fetching ward: $e');
    }
  }

  Future<void> _updateStatus(String orderId, String newStatus) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) return;

      final response = await http.put(
        Uri.parse('$apiBaseUrl/api/orders/update-status/$orderId'),
        headers: {
          'Content-Type': 'application/json',
          'token': token,
        },
        body: jsonEncode({'status': newStatus}),
      );

      if (response.statusCode == 200) {
        // Optimistic update or refetch
        _fetchDeliveries();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Status updated to $newStatus')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to update status')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (!mounted) return;
    Navigator.of(context).pushReplacementNamed('/login');
  }

  List<dynamic> get _filteredDeliveries {
    if (_activeTab == 'all') return _deliveries;
    return _deliveries.where((d) => d['status'] == _activeTab).toList();
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'in-transit':
        return Colors.blue;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        title: Text(_activeTab == 'all' ? 'Dashboard' : _activeTab.toUpperCase()),
        backgroundColor: Colors.green[700],
        foregroundColor: Colors.white,
      ),
      drawer: _buildDrawer(),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Colors.green[50]!, Colors.teal[50]!],
          ),
        ),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _buildDeliveryList(),
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      child: Column(
        children: [
          UserAccountsDrawerHeader(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.green[700]!, Colors.teal[700]!],
              ),
            ),
            accountName: Text(_user?['name'] ?? 'Delivery Partner'),
            accountEmail: Text(_assignedWard != null ? 'Ward: $_assignedWard' : (_user?['email'] ?? '')),
            currentAccountPicture: CircleAvatar(
              backgroundColor: Colors.white,
              child: Text(
                (_user?['name'] ?? 'D').substring(0, 1).toUpperCase(),
                style: TextStyle(fontSize: 24, color: Colors.green[700]),
              ),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.dashboard, color: Colors.green),
            title: const Text('Dashboard'),
            selected: _activeTab == 'all',
            onTap: () {
              setState(() => _activeTab = 'all');
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: const Icon(Icons.route, color: Colors.blue),
            title: const Text('My Routes (In-Transit)'),
            selected: _activeTab == 'in-transit',
            onTap: () {
              setState(() => _activeTab = 'in-transit');
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: const Icon(Icons.schedule, color: Colors.orange),
            title: const Text('Pending Requests'),
            selected: _activeTab == 'pending',
            onTap: () {
              setState(() => _activeTab = 'pending');
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: const Icon(Icons.check_circle, color: Colors.green),
            title: const Text('Completed'),
            selected: _activeTab == 'completed',
            onTap: () {
              setState(() => _activeTab = 'completed');
              Navigator.pop(context);
            },
          ),
          const Divider(),
          // Placeholder for modals as dialogs
          ListTile(
            leading: const Icon(Icons.person),
            title: const Text('Profile'),
            onTap: () {
              Navigator.pop(context);
              _showProfileDialog();
            },
          ),
           ListTile(
            leading: const Icon(Icons.event_available),
            title: const Text('Availability'),
            onTap: () {
              Navigator.pop(context);
              // TODO: Implement availability toggle
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Availability feature coming soon')));
            },
          ),
          const Spacer(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Logout', style: TextStyle(color: Colors.red)),
            onTap: _logout,
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildDeliveryList() {
    final list = _filteredDeliveries;
    if (list.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inventory_2_outlined, size: 60, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No deliveries found for $_activeTab',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final delivery = list[index];
        return _buildDeliveryCard(delivery);
      },
    );
  }

  Widget _buildDeliveryCard(dynamic delivery) {
    // Map backend fields to UI
    final status = delivery['status'] ?? 'unknown';
    final orderId = (delivery['_id'] ?? '').toString().substring(0, 8).toUpperCase();
    final items = (delivery['items'] as List?)?.map((i) => i['productId']?['name'] ?? 'Item').join(', ') ?? 'No items';
    final customerName = delivery['userId']?['name'] ?? 'Guest';
    final address = delivery['shippingAddress']?['address'] ?? 'No address';
    final ward = delivery['userId']?['wardNumber'] ?? 'N/A';
    final date = delivery['createdAt'] != null 
        ? DateTime.parse(delivery['createdAt']).toLocal().toString().split('.')[0] 
        : 'Unknown Date';

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: _getStatusColor(status).withOpacity(0.3)),
                  ),
                  child: Text(
                    status.toUpperCase(),
                    style: TextStyle(
                      color: _getStatusColor(status),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                Text('#$orderId', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
              ],
            ),
            const SizedBox(height: 12),
            
            // Customer Info
            Row(
              children: [
                const Icon(Icons.person, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text(customerName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.location_on, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Expanded(child: Text('$address (Ward $ward)', style: TextStyle(color: Colors.grey[700]))),
              ],
            ),
             const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.shopping_bag, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Expanded(child: Text(items, style: TextStyle(color: Colors.grey[700]), maxLines: 1, overflow: TextOverflow.ellipsis)),
              ],
            ),
             const SizedBox(height: 4),
             Row(
              children: [
                const Icon(Icons.access_time, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text(date, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
              ],
            ),

            const Divider(height: 24),

            // Actions
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (status == 'pending')
                  ElevatedButton.icon(
                    onPressed: () => _updateStatus(delivery['_id'], 'in-transit'),
                    icon: const Icon(Icons.local_shipping),
                    label: const Text('Start Delivery'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white),
                  ),
                if (status == 'in-transit')
                  ElevatedButton.icon(
                    onPressed: () => _updateStatus(delivery['_id'], 'completed'),
                    icon: const Icon(Icons.check),
                    label: const Text('Complete'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                  ),
                 if (status == 'completed')
                  const Text('Delivered ✅', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showProfileDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Profile'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Name: ${_user?['name']}'),
            const SizedBox(height: 8),
            Text('Email: ${_user?['email']}'),
            const SizedBox(height: 8),
            Text('Phone: ${_user?['phone'] ?? 'N/A'}'),
            const SizedBox(height: 8),
            Text('Role: ${_user?['role']}'),
            const SizedBox(height: 8),
            Text('Assigned Ward: ${_assignedWard ?? "Not assigned"}'),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
        ],
      ),
    );
  }
}
