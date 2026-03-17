import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const String apiBaseUrl = 'https://ecoloop-psi.vercel.app';

/// Chat with seller for a specific order (same as website).
class OrderChatPage extends StatefulWidget {
  const OrderChatPage({
    super.key,
    required this.orderId,
    required this.sellerId,
    required this.sellerName,
  });

  final String orderId;
  final String sellerId;
  final String sellerName;

  @override
  State<OrderChatPage> createState() => _OrderChatPageState();
}

class _OrderChatPageState extends State<OrderChatPage> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<Map<String, dynamic>> _messages = [];
  bool _loading = true;
  bool _sending = false;
  String? _currentUserId;

  @override
  void initState() {
    super.initState();
    _loadUser();
    _loadMessages();
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      final user = jsonDecode(userStr) as Map<String, dynamic>;
      setState(() => _currentUserId = user['id']?.toString());
    }
  }

  Future<void> _loadMessages() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) return;

    setState(() => _loading = true);
    try {
      final response = await http.get(
        Uri.parse('$apiBaseUrl/api/messages/history/${widget.orderId}'),
        headers: {'token': token},
      );
      if (!mounted) return;
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>?;
        final list = data?['messages'] as List<dynamic>? ?? [];
        setState(() {
          _messages = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
          _loading = false;
        });
        _scrollToEnd();
      } else {
        setState(() => _loading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please log in again')));
      return;
    }

    setState(() => _sending = true);
    _textController.clear();

    try {
      final response = await http.post(
        Uri.parse('$apiBaseUrl/api/messages/send'),
        headers: {
          'Content-Type': 'application/json',
          'token': token,
        },
        body: jsonEncode({
          'recipientId': widget.sellerId,
          'orderId': widget.orderId,
          'text': text,
        }),
      );
      if (!mounted) return;
      setState(() => _sending = false);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(response.body) as Map<String, dynamic>?;
        final msg = data?['data'] as Map<String, dynamic>?;
        if (msg != null) {
          setState(() => _messages.add(msg));
          _scrollToEnd();
        } else {
          _loadMessages();
        }
      } else {
        final data = jsonDecode(response.body) as Map<String, dynamic>?;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data?['message']?.toString() ?? 'Failed to send')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _sending = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(widget.sellerName),
            Text('Order #${widget.orderId.length >= 6 ? widget.orderId.substring(0, 6) : widget.orderId}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.normal)),
          ],
        ),
        backgroundColor: Colors.green.shade800,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                    ? Center(
                        child: Text(
                          'No messages yet. Say hello to ${widget.sellerName}.',
                          style: TextStyle(color: Colors.grey.shade600),
                          textAlign: TextAlign.center,
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                        itemCount: _messages.length,
                        itemBuilder: (context, i) {
                          final msg = _messages[i];
                          final senderId = (msg['sender'] is Map ? (msg['sender'] as Map)['_id']?.toString() : msg['sender']?.toString()) ?? '';
                          final isMe = senderId == _currentUserId;
                          final senderName = msg['sender'] is Map ? (msg['sender'] as Map)['name']?.toString() ?? 'You' : (isMe ? 'You' : widget.sellerName);
                          final text = msg['text']?.toString() ?? '';
                          final createdAt = msg['createdAt'] != null ? DateTime.tryParse(msg['createdAt'].toString()) : null;

                          return Align(
                            alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                              decoration: BoxDecoration(
                                color: isMe ? Colors.green.shade700 : Colors.grey.shade200,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (!isMe) Text(senderName, style: TextStyle(fontSize: 11, color: Colors.grey.shade700, fontWeight: FontWeight.w600)),
                                  Text(text, style: TextStyle(color: isMe ? Colors.white : Colors.black87, fontSize: 15)),
                                  if (createdAt != null)
                                    Text(
                                      '${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}',
                                      style: TextStyle(fontSize: 10, color: isMe ? Colors.white70 : Colors.grey.shade600),
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
          Container(
            padding: EdgeInsets.only(left: 12, right: 12, top: 8, bottom: 8 + MediaQuery.of(context).padding.bottom),
            color: Colors.grey.shade100,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textController,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                    maxLines: null,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: _sending ? null : _sendMessage,
                  icon: _sending ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.send),
                  style: IconButton.styleFrom(backgroundColor: Colors.green.shade700, foregroundColor: Colors.white),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
