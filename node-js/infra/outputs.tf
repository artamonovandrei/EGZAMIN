output "master_public_ip" { value = aws_instance.master.public_ip }
output "game_url" { value = "http://${aws_instance.master.public_ip}:30080" }
output "worker_private_ips" { value = aws_instance.worker[*].private_ip }
