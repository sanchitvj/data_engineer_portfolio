# Use an official Python runtime as a parent image
FROM public.ecr.aws/lambda/python:3.11

RUN yum install -y git

# ARG GITHUB_TOKEN

# Set the working directory
WORKDIR /app
RUN git clone https://github.com/sanchitvj/data_engineer_portfolio.git
WORKDIR /app/data_engineer_portfolio
RUN git checkout optimize
RUN pip install .

COPY src/penguindb/lambda_function/ ${LAMBDA_TASK_ROOT}/

WORKDIR ${LAMBDA_TASK_ROOT}
# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
#CMD ["file_update_check.lambda_handler"]